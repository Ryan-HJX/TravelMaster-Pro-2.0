package com.travelmaster.itinerary;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmaster.ai.dto.AiTaskResultRequest;
import com.travelmaster.ai.service.AiTaskPublisher;
import com.travelmaster.analytics.service.BehaviorEventService;
import com.travelmaster.auth.service.RateLimitService;
import com.travelmaster.common.exception.AppException;
import com.travelmaster.itinerary.dto.CreateTaskRequest;
import com.travelmaster.itinerary.dto.TaskResponse;
import com.travelmaster.itinerary.entity.Itinerary;
import com.travelmaster.itinerary.entity.ItineraryGenerationTask;
import com.travelmaster.itinerary.entity.TaskStatus;
import com.travelmaster.itinerary.repository.ItineraryGenerationTaskRepository;
import com.travelmaster.itinerary.repository.ItineraryItemRepository;
import com.travelmaster.itinerary.repository.ItineraryRepository;
import com.travelmaster.itinerary.service.ItineraryTaskService;
import com.travelmaster.config.TravelMasterProperties;
import com.travelmaster.notification.service.NotificationService;
import com.travelmaster.ranking.service.RankingService;
import com.travelmaster.social.repository.PostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ItineraryTaskServiceTest {

    @Mock private ItineraryGenerationTaskRepository taskRepository;
    @Mock private ItineraryRepository itineraryRepository;
    @Mock private ItineraryItemRepository itineraryItemRepository;
    @Mock private PostRepository postRepository;
    @Mock private AiTaskPublisher aiTaskPublisher;
    @Mock private RateLimitService rateLimitService;
    @Mock private RedissonClient redissonClient;
    @Mock private NotificationService notificationService;
    @Mock private RankingService rankingService;
    @Mock private BehaviorEventService behaviorEventService;
    @Mock private TravelMasterProperties properties;
    @Mock private RLock rLock;

    private ItineraryTaskService itineraryTaskService;

    private static final String USER_ID = "user-001";
    private static final String TASK_ID = "task-001";
    private static final String IP = "127.0.0.1";

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
        itineraryTaskService = new ItineraryTaskService(
                taskRepository, itineraryRepository, itineraryItemRepository,
                postRepository, aiTaskPublisher, rateLimitService, redissonClient,
                objectMapper, notificationService, rankingService, behaviorEventService,
                properties
        );
    }

    @Test
    @DisplayName("createTask - new task is created and published to stream")
    void createTask_new_success() {
        CreateTaskRequest request = new CreateTaskRequest("北京3天文化游", Map.of(), Map.of(), "v1-pro");

        when(redissonClient.getLock(anyString())).thenReturn(rLock);
        when(rLock.tryLock()).thenReturn(true);
        when(taskRepository.findByUserIdAndIdempotencyKey(eq(USER_ID), anyString())).thenReturn(Optional.empty());
        when(taskRepository.save(any(ItineraryGenerationTask.class))).thenAnswer(inv -> {
            ItineraryGenerationTask t = inv.getArgument(0);
            try {
                var field = t.getClass().getSuperclass().getDeclaredField("id");
                field.setAccessible(true);
                field.set(t, TASK_ID);
            } catch (Exception ignored) {}
            return t;
        });

        TaskResponse response = itineraryTaskService.createTask(USER_ID, request, null, IP);

        assertNotNull(response);
        assertEquals(TaskStatus.PENDING, response.status());
        verify(taskRepository).save(any(ItineraryGenerationTask.class));
        verify(aiTaskPublisher).publish(any(ItineraryGenerationTask.class), eq(request));
        verify(rLock).unlock();
    }

    @Test
    @DisplayName("createTask - duplicate idempotency key returns existing task")
    void createTask_duplicateIdempotencyKey_returnsExisting() {
        CreateTaskRequest request = new CreateTaskRequest("北京3天文化游", Map.of(), Map.of(), "v1-pro");
        ItineraryGenerationTask existing = buildTask(TASK_ID, TaskStatus.PROCESSING);

        when(redissonClient.getLock(anyString())).thenReturn(rLock);
        when(rLock.tryLock()).thenReturn(true);
        when(taskRepository.findByUserIdAndIdempotencyKey(eq(USER_ID), anyString())).thenReturn(Optional.of(existing));

        TaskResponse response = itineraryTaskService.createTask(USER_ID, request, "key-123", IP);

        assertNotNull(response);
        assertEquals(TASK_ID, response.taskId());
        verify(taskRepository, never()).save(any());
        verify(aiTaskPublisher, never()).publish(any(), any());
        verify(rLock).unlock();
    }

    @Test
    @DisplayName("createTask - lock contention throws CONFLICT")
    void createTask_lockContention_throwsConflict() {
        CreateTaskRequest request = new CreateTaskRequest("北京3天文化游", Map.of(), Map.of(), "v1-pro");

        when(redissonClient.getLock(anyString())).thenReturn(rLock);
        when(rLock.tryLock()).thenReturn(false);

        AppException exception = assertThrows(AppException.class,
                () -> itineraryTaskService.createTask(USER_ID, request, null, IP));
        assertEquals(409, exception.getStatus().value());
    }

    @Test
    @DisplayName("getTask - returns task for user")
    void getTask_success() {
        ItineraryGenerationTask task = buildTask(TASK_ID, TaskStatus.PENDING);
        when(taskRepository.findByIdAndUserId(TASK_ID, USER_ID)).thenReturn(Optional.of(task));

        TaskResponse response = itineraryTaskService.getTask(USER_ID, TASK_ID);

        assertEquals(TASK_ID, response.taskId());
        assertEquals(TaskStatus.PENDING, response.status());
    }

    @Test
    @DisplayName("getTask - not found throws 404")
    void getTask_notFound_throws404() {
        when(taskRepository.findByIdAndUserId(TASK_ID, USER_ID)).thenReturn(Optional.empty());

        assertThrows(AppException.class,
                () -> itineraryTaskService.getTask(USER_ID, TASK_ID));
    }

    private ItineraryGenerationTask buildTask(String id, TaskStatus status) {
        ItineraryGenerationTask task = new ItineraryGenerationTask();
        try {
            var field = task.getClass().getSuperclass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(task, id);
            var catField = task.getClass().getSuperclass().getDeclaredField("createdAt");
            catField.setAccessible(true);
            catField.set(task, LocalDateTime.now());
            var uatField = task.getClass().getSuperclass().getDeclaredField("updatedAt");
            uatField.setAccessible(true);
            uatField.set(task, LocalDateTime.now());
        } catch (Exception ignored) {}
        task.setUserId(USER_ID);
        task.setUserInput("北京3天文化游");
        task.setStatus(status);
        task.setPromptVersion("v1-pro");
        task.setTraceId("trace-001");
        task.setIdempotencyKey("key-001");
        task.setRequestPayload("{}");
        return task;
    }
}