package com.travelmaster.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmaster.common.exception.AppException;
import com.travelmaster.config.TravelMasterProperties;
import com.travelmaster.notification.dto.NotificationResponse;
import com.travelmaster.notification.entity.Notification;
import com.travelmaster.notification.entity.NotificationType;
import com.travelmaster.notification.repository.NotificationRepository;
import com.travelmaster.notification.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.core.StreamOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private TravelMasterProperties properties;
    @Mock private StreamOperations<String, Object, Object> streamOps;

    private NotificationService notificationService;

    private static final String USER_ID = "user-001";
    private static final String ACTOR_ID = "user-002";

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
        notificationService = new NotificationService(
                notificationRepository, redisTemplate, messagingTemplate, properties, objectMapper
        );
    }

    // ---- Create Notification ----

    @Test
    @DisplayName("createNotification - saves, publishes to Redis Stream, and pushes via WebSocket")
    void createNotification_success() {
        TravelMasterProperties.Redis redisProps = new TravelMasterProperties.Redis();
        redisProps.setNotificationStream("test:notifications");
        when(properties.getRedis()).thenReturn(redisProps);
        when(redisTemplate.opsForStream()).thenReturn(streamOps);
        when(streamOps.add(any(MapRecord.class))).thenReturn(null);

        Notification saved = buildNotification("notif-001", false);
        when(notificationRepository.save(any(Notification.class))).thenReturn(saved);

        Notification result = notificationService.createNotification(
                USER_ID, ACTOR_ID, NotificationType.POST_LIKED,
                "New like on your post", "User liked your post",
                "post", "post-001"
        );

        assertNotNull(result);
        assertEquals("notif-001", result.getId());
        verify(notificationRepository).save(any(Notification.class));
        verify(streamOps).add(any(MapRecord.class));
        verify(messagingTemplate).convertAndSend(eq("/topic/users/" + USER_ID + "/notifications"), any(NotificationResponse.class));
    }

    // ---- List Notifications ----

    @Test
    @DisplayName("listNotifications - returns notifications for user")
    void listNotifications_success() {
        Notification n1 = buildNotification("notif-001", false);
        Notification n2 = buildNotification("notif-002", true);
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(eq(USER_ID), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(n1, n2)));

        List<NotificationResponse> result = notificationService.listNotifications(USER_ID, 0, 20);

        assertEquals(2, result.size());
        assertFalse(result.get(0).read());
        assertTrue(result.get(1).read());
    }

    // ---- Mark Read ----

    @Test
    @DisplayName("markRead - marks notification as read")
    void markRead_success() {
        Notification notification = buildNotification("notif-001", false);
        when(notificationRepository.findByIdAndUserId("notif-001", USER_ID)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> {
            Notification n = inv.getArgument(0);
            n.setReadStatus(true);
            return n;
        });

        NotificationResponse response = notificationService.markRead(USER_ID, "notif-001");

        assertTrue(response.read());
        verify(notificationRepository).save(notification);
    }

    @Test
    @DisplayName("markRead - notification not found throws 404")
    void markRead_notFound_throws404() {
        when(notificationRepository.findByIdAndUserId("notif-999", USER_ID)).thenReturn(Optional.empty());

        assertThrows(AppException.class,
                () -> notificationService.markRead(USER_ID, "notif-999"));
    }

    private Notification buildNotification(String id, boolean read) {
        Notification notification = new Notification();
        try {
            var idField = notification.getClass().getSuperclass().getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(notification, id);
            var catField = notification.getClass().getSuperclass().getDeclaredField("createdAt");
            catField.setAccessible(true);
            catField.set(notification, LocalDateTime.now());
        } catch (Exception ignored) {}
        notification.setUserId(USER_ID);
        notification.setActorId(ACTOR_ID);
        notification.setType(NotificationType.POST_LIKED);
        notification.setTitle("New like");
        notification.setContent("User liked your post");
        notification.setRelatedResourceType("post");
        notification.setRelatedResourceId("post-001");
        notification.setReadStatus(read);
        return notification;
    }
}
