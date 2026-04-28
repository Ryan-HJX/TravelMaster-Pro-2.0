package com.travelmaster.itinerary.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.Map;

public record CreateTaskRequest(
        @NotBlank(message = "userInput is required")
        String userInput,
        Map<String, Object> preferences,
        Map<String, Object> travelConstraints,
        String promptVersion
) {
}
