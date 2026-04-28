package com.travelmaster.itinerary.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ItineraryResponse(
        String itineraryId,
        String title,
        String summary,
        String riskTips,
        String renderedMarkdown,
        String structuredContent,
        LocalDateTime publishedAt,
        List<ItineraryItemResponse> items
) {
}
