package com.travelmaster.itinerary.dto;

public record ItineraryItemResponse(
        Integer dayNumber,
        Integer sequenceNumber,
        String itemTitle,
        String activityType,
        String address,
        String startTime,
        String endTime,
        String transportMode,
        Integer transportDurationMinutes,
        String notes
) {
}
