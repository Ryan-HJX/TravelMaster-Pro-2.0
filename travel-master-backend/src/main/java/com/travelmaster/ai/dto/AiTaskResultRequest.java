package com.travelmaster.ai.dto;

import java.util.List;
import java.util.Map;

public record AiTaskResultRequest(
        boolean success,
        String traceId,
        String promptVersion,
        String title,
        String summary,
        String riskTips,
        String renderedMarkdown,
        Map<String, Object> structuredContent,
        List<DayPlan> days,
        String failureReason,
        // ── 2.0 MCP enhanced fields ──────────────────────────
        String modelProvider,
        String modelName,
        String mcpTrace,
        String toolCalls,
        Boolean fallbackUsed,
        String planningScore,
        String startLocation,
        String endLocation,
        String travelModePreference,
        String weatherSummary,
        String financeSummary
) {
    public record DayPlan(
            Integer dayNumber,
            String title,
            List<PlanItem> items
    ) {
    }

    public record PlanItem(
            Integer sequenceNumber,
            String itemTitle,
            String activityType,
            String address,
            String startTime,
            String endTime,
            RouteSegment transport,
            String notes
    ) {
    }

    public record RouteSegment(
            String mode,
            Integer durationMinutes
    ) {
    }
}
