package com.travelmaster.itinerary.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmaster.ai.dto.AiTaskResultRequest;
import com.travelmaster.ai.service.AiTaskPublisher;
import com.travelmaster.analytics.service.BehaviorEventService;
import com.travelmaster.auth.service.RateLimitService;
import com.travelmaster.common.exception.AppException;
import com.travelmaster.config.TravelMasterProperties;
import com.travelmaster.itinerary.dto.CreateTaskRequest;
import com.travelmaster.itinerary.dto.ItineraryItemResponse;
import com.travelmaster.itinerary.dto.ItineraryResponse;
import com.travelmaster.itinerary.dto.ProgressStep;
import com.travelmaster.itinerary.dto.PublishItineraryRequest;
import com.travelmaster.itinerary.dto.TaskProgress;
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
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
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
    private final WebClient pythonWebClient;

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
                                BehaviorEventService behaviorEventService,
                                TravelMasterProperties properties) {
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
        
        String baseUrl = properties.getAi() != null && properties.getAi().getBaseUrl() != null
                ? properties.getAi().getBaseUrl()
                : "http://localhost:8000";
        this.pythonWebClient = WebClient.builder()
                .baseUrl(baseUrl)
                .clientConnector(new ReactorClientHttpConnector(
                        HttpClient.create().responseTimeout(Duration.ofSeconds(30))
                ))
                .build();
    }

    @Transactional
    public TaskResponse createTask(String userId, CreateTaskRequest request, String rawIdempotencyKey, String ip) {
        rateLimitService.assertWithinLimit("itinerary-task", userId, ip, 20, 60, Duration.ofMinutes(1));
        String idempotencyKey = rawIdempotencyKey == null || rawIdempotencyKey.isBlank()
                ? UUID.randomUUID().toString()
                : rawIdempotencyKey;
        RLock lock = redissonClient.getLock("lock:itinerary-task:" + userId + ":" + idempotencyKey);
        boolean locked = lock.tryLock();
        if (!locked) {
            throw new AppException(HttpStatus.CONFLICT, "duplicate task submission in progress");
        }
        try {
            return taskRepository.findByUserIdAndIdempotencyKey(userId, idempotencyKey)
                    .map(existingTask -> {
                        if (existingTask.getStatus() == TaskStatus.FAILED) {
                            existingTask.setStatus(TaskStatus.PENDING);
                            existingTask.setFailureReason(null);
                            ItineraryGenerationTask updated = taskRepository.save(existingTask);
                            aiTaskPublisher.publish(updated, request);
                            return toTaskResponse(updated);
                        }
                        return toTaskResponse(existingTask);
                    })
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

    public ItineraryResponse getItinerary(String userId, String itineraryId) {
        return itineraryRepository.findByIdAndUserId(itineraryId, userId)
                .map(this::toItineraryResponse)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "itinerary not found"));
    }

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(cacheNames = {"postFeed", "hotItineraries", "creatorRanking"}, allEntries = true)
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
        // 2.0 enhanced fields
        itinerary.setStartLocation(result.startLocation());
        itinerary.setEndLocation(result.endLocation());
        itinerary.setTravelModePreference(result.travelModePreference());
        itinerary.setWeatherSummary(result.weatherSummary());
        itinerary.setFinanceSummary(result.financeSummary());
        itinerary.setPlanningScore(result.planningScore());
        // 3.0 inter-city transportation
        itinerary.setDepartureCity(result.departureCity());
        if (result.startDate() != null) {
            itinerary.setStartDate(java.time.LocalDate.parse(result.startDate()));
        }
        if (result.endDate() != null) {
            itinerary.setEndDate(java.time.LocalDate.parse(result.endDate()));
        }
        itinerary.setTransportSummary(result.transportSummary());
        try {
            Itinerary savedItinerary = itineraryRepository.save(itinerary);

            if (result.days() != null) {
                for (AiTaskResultRequest.DayPlan dayPlan : result.days()) {
                    if (dayPlan.items() == null || dayPlan.dayNumber() == null) {
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
            // 2.0 MCP observability
            task.setModelProvider(result.modelProvider());
            task.setModelName(result.modelName());
            task.setMcpTrace(result.mcpTrace());
            task.setToolCalls(result.toolCalls());
            task.setFallbackUsed(Boolean.TRUE.equals(result.fallbackUsed()));
            task.setPlanningScore(result.planningScore());
            taskRepository.save(task);
            
            notificationService.createNotification(task.getUserId(), null, NotificationType.TASK_COMPLETED,
                    "Itinerary is ready", result.summary(), "itinerary", savedItinerary.getId());
            behaviorEventService.log(task.getUserId(), "TASK_COMPLETED", "task", task.getId(), Map.of("itineraryId", savedItinerary.getId()));
            return toTaskResponse(task);
        } catch (Exception e) {
            log.error("!!! [DATABASE FATAL] Failed to save itinerary for task {}: {}", taskId, e.getMessage(), e);
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "failed to save result: " + e.getMessage());
        }
    }

    @Transactional
    @org.springframework.cache.annotation.CacheEvict(cacheNames = {"postFeed", "hotItineraries", "creatorRanking"}, allEntries = true)
    public void deleteItinerary(String userId, String itineraryId) {
        Itinerary itinerary = itineraryRepository.findByIdAndUserId(itineraryId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "itinerary not found"));
        
        // 1. 如果行程已发布，先删除对应的 post 记录（解除外键约束）
        postRepository.findByItineraryId(itineraryId).ifPresent(post -> {
            // 清除排行榜数据
            rankingService.removePost(post);
            // 删除点赞、收藏、评论等关联数据
            behaviorEventService.log(userId, "POST_DELETED", "post", post.getId(), null);
            postRepository.delete(post);
        });
        
        // 2. 删除关联的行程项（itinerary_items → itineraries）
        itineraryItemRepository.deleteByItineraryId(itineraryId);
        
        // 3. 保存 taskId 用于后续删除
        String taskId = itinerary.getTaskId();
        
        // 4. 删除行程主记录（必须在删除任务之前，因为 itineraries.task_id 引用了任务表）
        itineraryRepository.delete(itinerary);
        
        // 5. 最后删除关联的任务记录（此时没有行程引用该任务了）
        if (taskId != null) {
            taskRepository.deleteById(taskId);
        }
        
        // 6. 记录行为事件
        behaviorEventService.log(userId, "ITINERARY_DELETED", "itinerary", itineraryId, null);
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
        
        // Fetch progress from Python service
        TaskProgress progress = fetchTaskProgress(task.getId());
        
        return new TaskResponse(
                task.getId(),
                task.getTraceId(),
                task.getPromptVersion(),
                task.getUserInput(),
                task.getStatus(),
                task.getFailureReason(),
                task.getCreatedAt(),
                task.getUpdatedAt(),
                itinerary,
                progress
        );
    }

    private TaskProgress fetchTaskProgress(String taskId) {
        try {
            // Call Python service's progress endpoint
            Map<String, Object> progressData = pythonWebClient.get()
                    .uri("/api/v1/tasks/{taskId}/progress", taskId)
                    .retrieve()
                    .onStatus(
                        HttpStatusCode::is4xxClientError,
                        response -> Mono.empty()  // Return empty Mono to suppress the error
                    )
                    .bodyToMono(Map.class)
                    .block(Duration.ofSeconds(2));
            
            if (progressData == null || !"success".equals(progressData.get("code"))) {
                return null;
            }
            
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) progressData.get("data");
            if (data == null) {
                return null;
            }
            
            // Parse steps
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> stepsData = (List<Map<String, Object>>) data.get("steps");
            List<ProgressStep> steps = stepsData != null ? 
                stepsData.stream()
                    .map(s -> new ProgressStep(
                        (String) s.get("stepId"),
                        (String) s.get("stepName"),
                        (String) s.get("description"),
                        (String) s.get("status"),
                        s.get("startTime") != null ? LocalDateTime.parse((String) s.get("startTime")) : null,
                        s.get("endTime") != null ? LocalDateTime.parse((String) s.get("endTime")) : null
                    ))
                    .toList() : Collections.emptyList();
            
            return new TaskProgress(
                (String) data.get("taskId"),
                (String) data.get("currentStep"),
                data.get("overallProgress") != null ? ((Number) data.get("overallProgress")).intValue() : 0,
                steps,
                (String) data.get("createdAt"),
                (String) data.get("updatedAt")
            );
        } catch (Exception e) {
            // Log at debug level to avoid spamming logs for expired tasks
            log.debug("Failed to fetch progress for task {}: {}", taskId, e.getMessage());
            return null;
        }
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
                itinerary.getFinanceSummary(),
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
