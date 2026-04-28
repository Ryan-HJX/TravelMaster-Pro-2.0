package com.travelmaster.itinerary.dto;

import java.time.LocalDateTime;

/**
 * Represents a single step in the itinerary generation workflow.
 */
public record ProgressStep(
        String stepId,
        String stepName,
        String description,
        String status,  // pending, processing, completed, failed
        LocalDateTime startTime,
        LocalDateTime endTime
) {
}
