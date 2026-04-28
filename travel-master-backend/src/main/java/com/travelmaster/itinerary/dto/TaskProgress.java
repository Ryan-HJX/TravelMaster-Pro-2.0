package com.travelmaster.itinerary.dto;

import java.util.List;

/**
 * Represents the real-time progress of an itinerary generation task.
 */
public record TaskProgress(
        String taskId,
        String currentStep,
        int overallProgress,  // 0-100
        List<ProgressStep> steps,
        String createdAt,
        String updatedAt
) {
}
