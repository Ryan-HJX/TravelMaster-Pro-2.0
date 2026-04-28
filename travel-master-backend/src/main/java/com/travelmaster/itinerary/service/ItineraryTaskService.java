package com.travelmaster.itinerary.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmaster.ai.dto.AiTaskResultRequest;
import com.travelmaster.ai.service.AiTaskPublisher;
import com.travelmaster.analytics.service.BehaviorEventService;
import com.travelmaster.auth.service.RateLimitService;
import com.travelmaster.common.exception.AppException;
import com.travelmaster.itinerary.dto.CreateTaskRequest;
import com.travelmaster.itinerary.dto.ItineraryItemResponse;
import com.travelmaster.itinerary.dto.ItineraryResponse;
import com.travelmaster.itinerary.dto.PublishItineraryRequest;
import com.travelmaster.itinerary.dto.TaskResponse;
import com.travelmaster.itinerary.entity.Itinerary;
import com.travelmaster.itinerary.entity.ItineraryGenerationTask;
import com.travelmaster.itinerary.entity.ItineraryItem;
import com.travelmaster.itinerary.entity.TaskStatus;
import com.travelmaster.itinerary.repository.ItineraryGenerationTaskRepository;
import com.travelmaster.itinerary.repository.ItineraryItemRepository;
import com.travelmaster.itinerary.repository.ItineraryRepository;
import com.travelmaster.notification.entity.NotificationType;
import com.travelmaster.notification.service.NotificationService;
import com.travelmaster.ranking.service.RankingService;
import com.travelmaster.social.dto.PostResponse;
import com.travelmaster.social.entity.Post;
import com.travelmaster.social.repository.PostRepository;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ItineraryTaskService {
    private final ItineraryGenerationTaskRepository taskRepository;
    private final ItineraryRepository itineraryRepository;
    private final ItineraryItemRepository itineraryItemRepository;
    private final PostRepository postRepository;
    private final AiTaskPublisher aiTaskPublisher;
    private final RateLimitService rateLimitService;
    private final RedissonClient redissonClient;
    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;
    private final RankingService rankingService;
    private final BehaviorEventService behaviorEventService;

    public ItineraryTaskService(ItineraryGenerationTaskRepository taskRepository,
                                ItineraryRepository itineraryRepository,
                                ItineraryItemRepository itineraryItemRepository,
                                PostRepository postRepository,
                                AiTaskPublisher aiTaskPublisher,
                                RateLimitService rateLimitService,
                                RedissonClient redissonClient,
                                ObjectMapper objectMapper,
                                NotificationService notificationService,
                                RankingService rankingService,
                                BehaviorEventService behaviorEventService) {
        this.taskRepository = taskRepository;
        this.itineraryRepository = itineraryRepository;
        this.itineraryItemRepository = itineraryItemRepository;
        this.postRepository = postRepository;
        this.aiTaskPublisher = aiTaskPublisher;
        this.rateLimitService = rateLimitService;
        this.redissonClient = redissonClient;
        this.objectMapper = objectMapper;
        this.notificationService = notificationService;
        this.rankingService = rankingService;
        this.behaviorEventService = behaviorEventService;
    }

    @Transactional
    public TaskResponse createTask(String userId, CreateTaskRequest request, String rawIdempotencyKey, String ip) {
        rateLimitService.assertWithinLimit("itinerary-task", userId, ip, 20, 60, Duration.ofMinutes(1));
        String idempotencyKey = rawIdempotencyKey == null || rawIdempotencyKey.isBlank()
                ? Integer.toHexString((userId + ":" + request.userInput()).hashCode())
                : rawIdempotencyKey;
        RLock lock = redissonClient.getLock("lock:itinerary-task:" + userId + ":" + idempotencyKey);
        boolean locked = lock.tryLock();
        if (!locked) {
            throw new AppException(HttpStatus.CONFLICT, "duplicate task submission in progress");
        }
        try {
            return taskRepository.findByUserIdAndIdempotencyKey(userId, idempotencyKey)
                    .map(this::toTaskResponse)
                    .orElseGet(() -> createNewTask(userId, request, idempotencyKey));
        } finally {
            lock.unlock();
        }
    }

    public TaskResponse getTask(String userId, String taskId) {
        return taskRepository.findByIdAndUserId(taskId, userId)
                .map(this::toTaskResponse)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "task not found"));
    }

    public List<ItineraryResponse> history(String userId) {
        return itineraryRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toItineraryResponse)
                .toList();
    }

    @Transactional
    public PostResponse publish(String userId, String itineraryId, PublishItineraryRequest request) {
        Itinerary itinerary = itineraryRepository.findByIdAndUserId(itineraryId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "itinerary not found"));
        Post post = postRepository.findByItineraryId(itineraryId).orElseGet(Post::new);
        post.setItineraryId(itineraryId);
        post.setUserId(userId);
        post.setTitle(request.title());
        post.setContentExcerpt(request.caption() == null || request.caption().isBlank()
                ? itinerary.getSummary()
                : request.caption());
        post.setPublishedAt(LocalDateTime.now());
        Post saved = postRepository.save(post);
        itinerary.setPublishedAt(saved.getPublishedAt());
        itineraryRepository.save(itinerary);
        rankingService.recordPublished(saved);
        behaviorEventService.log(userId, "POST_PUBLISHED", "post", saved.getId(), Map.of("itineraryId", itineraryId));
        return new PostResponse(saved.getId(), saved.getItineraryId(), saved.getTitle(), saved.getContentExcerpt(),
                saved.getLikeCount(), saved.getFavoriteCount(), saved.getCommentCount(), false, false, null, saved.getPublishedAt());
    }

    @Transactional
    public TaskResponse completeTask(String taskId, AiTaskResultRequest result) {
        ItineraryGenerationTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "task not found"));
        if (task.getStatus() == TaskStatus.COMPLETED) {
            return toTaskResponse(task);
        }

        if (!result.success()) {
            task.setStatus(TaskStatus.FAILED);
            task.setFailureReason(result.failureReason());
            task.setCompletedAt(LocalDateTime.now());
            task.setResultPayload(writeJson(result));
            taskRepository.save(task);
            notificationService.createNotification(task.getUserId(), null, NotificationType.TASK_FAILED,
                    "Itinerary generation failed", result.failureReason(), "task", task.getId());
            behaviorEventService.log(task.getUserId(), "TASK_FAILED", "task", task.getId(), Map.of("traceId", result.traceId()));
            return toTaskResponse(task);
        }

        Itinerary itinerary = new Itinerary();
        itinerary.setUserId(task.getUserId());
        itinerary.setTaskId(task.getId());
        itinerary.setTitle(result.title());
        itinerary.setSummary(result.summary());
        itinerary.setRiskTips(result.riskTips());
        itinerary.setRenderedMarkdown(result.renderedMarkdown());
        itinerary.setStructuredContent(writeJson(result.structuredContent()));
        Itinerary savedItinerary = itineraryRepository.save(itinerary);

        if (result.days() != null) {
            for (AiTaskResultRequest.DayPlan dayPlan : result.days()) {
                if (dayPlan.items() == null) {
                    continue;
                }
                for (AiTaskResultRequest.PlanItem planItem : dayPlan.items()) {
                    ItineraryItem item = new ItineraryItem();
                    item.setItineraryId(savedItinerary.getId());
                    item.setDayNumber(dayPlan.dayNumber());
                    item.setSequenceNumber(planItem.sequenceNumber());
                    item.setItemTitle(planItem.itemTitle());
                    item.setActivityType(planItem.activityType());
                    item.setAddress(planItem.address());
                    item.setStartTime(planItem.startTime());
                    item.setEndTime(planItem.endTime());
                    if (planItem.transport() != null) {
                        item.setTransportMode(planItem.transport().mode());
                        item.setTransportDurationMinutes(planItem.transport().durationMinutes());
                    }
                    item.setNotes(planItem.notes());
                    itineraryItemRepository.save(item);
                }
            }
        }

        task.setStatus(TaskStatus.COMPLETED);
        task.setCompletedAt(LocalDateTime.now());
        task.setItineraryId(savedItinerary.getId());
        task.setFailureReason(null);
        task.setResultPayload(writeJson(result));
        taskRepository.save(task);
        notificationService.createNotification(task.getUserId(), null, NotificationType.TASK_COMPLETED,
                "Itinerary is ready", result.summary(), "itinerary", savedItinerary.getId());
        behaviorEventService.log(task.getUserId(), "TASK_COMPLETED", "task", task.getId(), Map.of("itineraryId", savedItinerary.getId()));
        return toTaskResponse(task);
    }

    private TaskResponse createNewTask(String userId, CreateTaskRequest request, String idempotencyKey) {
        ItineraryGenerationTask task = new ItineraryGenerationTask();
        task.setUserId(userId);
        task.setUserInput(request.userInput());
        task.setPromptVersion(request.promptVersion() == null || request.promptVersion().isBlank() ? "v1-pro" : request.promptVersion());
        task.setTraceId(UUID.randomUUID().toString().replace("-", ""));
        task.setIdempotencyKey(idempotencyKey);
        task.setRequestPayload(writeJson(request));
        ItineraryGenerationTask saved = taskRepository.save(task);
        aiTaskPublisher.publish(saved, request);
        behaviorEventService.log(userId, "TASK_CREATED", "task", saved.getId(), Map.of("promptVersion", saved.getPromptVersion()));
        return toTaskResponse(saved);
    }

    private TaskResponse toTaskResponse(ItineraryGenerationTask task) {
        ItineraryResponse itinerary = null;
        if (task.getItineraryId() != null) {
            itinerary = itineraryRepository.findById(task.getItineraryId()).map(this::toItineraryResponse).orElse(null);
        }
        return new TaskResponse(
                task.getId(),
                task.getTraceId(),
                task.getPromptVersion(),
                task.getUserInput(),
                task.getStatus(),
                task.getFailureReason(),
                task.getCreatedAt(),
                task.getUpdatedAt(),
                itinerary
        );
    }

    private ItineraryResponse toItineraryResponse(Itinerary itinerary) {
        List<ItineraryItemResponse> items = itineraryItemRepository.findByItineraryIdOrderByDayNumberAscSequenceNumberAsc(itinerary.getId())
                .stream()
                .map(item -> new ItineraryItemResponse(
                        item.getDayNumber(),
                        item.getSequenceNumber(),
                        item.getItemTitle(),
                        item.getActivityType(),
                        item.getAddress(),
                        item.getStartTime(),
                        item.getEndTime(),
                        item.getTransportMode(),
                        item.getTransportDurationMinutes(),
                        item.getNotes()
                ))
                .toList();
        return new ItineraryResponse(
                itinerary.getId(),
                itinerary.getTitle(),
                itinerary.getSummary(),
                itinerary.getRiskTips(),
                itinerary.getRenderedMarkdown(),
                itinerary.getStructuredContent(),
                itinerary.getPublishedAt(),
                items
        );
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "failed to serialize payload");
        }
    }
}
