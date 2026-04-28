package com.travelmaster.itinerary.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PublishItineraryRequest(
        @NotBlank(message = "title is required")
        @Size(max = 200, message = "title too long")
        String title,
        @Size(max = 500, message = "caption too long")
        String caption
) {
}
