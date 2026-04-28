package com.travelmaster.notification.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmaster.common.exception.AppException;
import com.travelmaster.config.TravelMasterProperties;
import com.travelmaster.notification.dto.NotificationResponse;
import com.travelmaster.notification.entity.Notification;
import com.travelmaster.notification.entity.NotificationType;
import com.travelmaster.notification.repository.NotificationRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final StringRedisTemplate redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final TravelMasterProperties properties;
    private final ObjectMapper objectMapper;

    public NotificationService(NotificationRepository notificationRepository,
                               StringRedisTemplate redisTemplate,
                               SimpMessagingTemplate messagingTemplate,
                               TravelMasterProperties properties,
                               ObjectMapper objectMapper) {
        this.notificationRepository = notificationRepository;
        this.redisTemplate = redisTemplate;
        this.messagingTemplate = messagingTemplate;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public Notification createNotification(String userId,
                                           String actorId,
                                           NotificationType type,
                                           String title,
                                           String content,
                                           String resourceType,
                                           String resourceId) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setActorId(actorId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setRelatedResourceType(resourceType);
        notification.setRelatedResourceId(resourceId);
        Notification saved = notificationRepository.save(notification);
        NotificationResponse response = toResponse(saved);

        Map<String, String> payload = new LinkedHashMap<>();
        payload.put("notificationId", saved.getId());
        payload.put("userId", userId);
        payload.put("type", type.name());
        payload.put("payload", writeJson(response));
        redisTemplate.opsForStream().add(MapRecord.create(properties.getRedis().getNotificationStream(), payload));
        messagingTemplate.convertAndSend("/topic/users/" + userId + "/notifications", response);
        return saved;
    }

    public List<NotificationResponse> listNotifications(String userId, int page, int size) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public NotificationResponse markRead(String userId, String notificationId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "notification not found"));
        notification.setReadStatus(Boolean.TRUE);
        return toResponse(notificationRepository.save(notification));
    }

    public NotificationResponse toResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getContent(),
                notification.getActorId(),
                notification.getRelatedResourceType(),
                notification.getRelatedResourceId(),
                Boolean.TRUE.equals(notification.getReadStatus()),
                notification.getCreatedAt()
        );
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            return "{}";
        }
    }
}
