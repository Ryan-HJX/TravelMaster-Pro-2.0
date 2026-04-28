package com.travelmaster.analytics.controller;

import com.travelmaster.analytics.service.AnalyticsService;
import com.travelmaster.common.dto.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/overview")
    public ApiResponse<Map<String, Object>> overview() {
        return ApiResponse.success(analyticsService.overview());
    }

    @GetMapping("/funnel")
    public ApiResponse<Map<String, Object>> funnel() {
        return ApiResponse.success(analyticsService.funnel());
    }

    @GetMapping("/destinations")
    public ApiResponse<List<Map<String, Object>>> destinations() {
        return ApiResponse.success(analyticsService.destinations());
    }
}
