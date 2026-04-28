package com.travelmaster.notification.dto;

import com.travelmaster.notification.entity.NotificationType;

import java.time.LocalDateTime;

public record NotificationResponse(
        String notificationId,
        NotificationType type,
        String title,
        String content,
        String actorId,
        String relatedResourceType,
        String relatedResourceId,
        boolean read,
        LocalDateTime createdAt
) {
}
