package com.travelmaster.ranking.controller;

import com.travelmaster.common.dto.ApiResponse;
import com.travelmaster.ranking.service.RankingService;
import com.travelmaster.social.dto.AuthorSummaryResponse;
import com.travelmaster.social.dto.PostResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 排行榜控制器
 * 
 * 提供热门行程和优质创作者排行榜
 */
@RestController
@RequestMapping("/api/rankings")
@Tag(name = "排行榜模块", description = "热门行程和优质创作者排行榜接口")
public class RankingController {
    private final RankingService rankingService;

    public RankingController(RankingService rankingService) {
        this.rankingService = rankingService;
    }

    @GetMapping("/hot-itineraries")
    @Operation(
        summary = "获取热门行程榜",
        description = "根据点赞数、浏览量等指标计算热门行程排行榜"
    )
    public ApiResponse<List<PostResponse>> hotItineraries(
            @Parameter(description = "返回数量限制", example = "10")
            @RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.success(rankingService.hotItineraries(limit));
    }

    @GetMapping("/creators")
    @Operation(
        summary = "获取优质创作者榜",
        description = "根据作品质量、互动数据等评选优质创作者"
    )
    public ApiResponse<List<AuthorSummaryResponse>> creators(
            @Parameter(description = "返回数量限制", example = "10")
            @RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.success(rankingService.topCreators(limit));
    }
}
