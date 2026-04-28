package com.travelmaster.itinerary.dto;

import com.travelmaster.itinerary.entity.TaskStatus;

import java.time.LocalDateTime;

public record TaskResponse(
        String taskId,
        String traceId,
        String promptVersion,
        String userInput,
        TaskStatus status,
        String failureReason,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        ItineraryResponse itinerary,
        TaskProgress progress
) {
}
