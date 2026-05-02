package com.travelmaster.analytics.controller;

import com.travelmaster.analytics.service.AnalyticsService;
import com.travelmaster.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 数据分析控制器
 * 
 * 提供运营数据概览、转化漏斗、目的地统计等分析功能
 */
@RestController
@RequestMapping("/api/analytics")
@Tag(name = "数据分析模块", description = "运营数据分析、转化漏斗、目的地统计接口")
public class AnalyticsController {
    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/overview")
    @Operation(
        summary = "获取运营概览",
        description = "获取平台整体运营数据，包括用户数、行程数、互动数等关键指标"
    )
    public ApiResponse<Map<String, Object>> overview() {
        return ApiResponse.success(analyticsService.overview());
    }

    @GetMapping("/funnel")
    @Operation(
        summary = "获取转化漏斗",
        description = "分析用户从注册到发布行程的转化流程数据"
    )
    public ApiResponse<Map<String, Object>> funnel() {
        return ApiResponse.success(analyticsService.funnel());
    }

    @GetMapping("/destinations")
    @Operation(
        summary = "获取目的地统计",
        description = "统计热门旅行目的地的分布和趋势"
    )
    public ApiResponse<List<Map<String, Object>>> destinations() {
        return ApiResponse.success(analyticsService.destinations());
    }
}
