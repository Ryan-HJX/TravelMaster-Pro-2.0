package com.travelmaster.compat;

import java.util.List;

public record PlanResponse(
        int code,
        DataContent data,
        String message
) {
    public record DataContent(String itinerary, List<Object> waypoints) {
    }
}
