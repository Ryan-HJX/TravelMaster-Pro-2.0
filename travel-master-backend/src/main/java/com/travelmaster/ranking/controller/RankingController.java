package com.travelmaster.ranking.controller;

import com.travelmaster.common.dto.ApiResponse;
import com.travelmaster.ranking.service.RankingService;
import com.travelmaster.social.dto.AuthorSummaryResponse;
import com.travelmaster.social.dto.PostResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/rankings")
public class RankingController {
    private final RankingService rankingService;

    public RankingController(RankingService rankingService) {
        this.rankingService = rankingService;
    }

    @GetMapping("/hot-itineraries")
    public ApiResponse<List<PostResponse>> hotItineraries(@RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.success(rankingService.hotItineraries(limit));
    }

    @GetMapping("/creators")
    public ApiResponse<List<AuthorSummaryResponse>> creators(@RequestParam(defaultValue = "10") int limit) {
        return ApiResponse.success(rankingService.topCreators(limit));
    }
}
