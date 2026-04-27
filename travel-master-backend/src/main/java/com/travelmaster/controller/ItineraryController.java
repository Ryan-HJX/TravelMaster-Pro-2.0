package com.travelmaster.controller;

import com.travelmaster.dto.PlanRequest;
import com.travelmaster.dto.PlanResponse;
import com.travelmaster.entity.Itinerary;
import com.travelmaster.service.ItineraryService;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import java.util.List;

/**
 * 行程规划控制器：对外提供 RESTful API。
 */
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/travel")
public class ItineraryController {

    private final ItineraryService itineraryService;

    public ItineraryController(ItineraryService itineraryService) {
        this.itineraryService = itineraryService;
    }

    /**
     * 简单的健康检查接口。
     */
    @GetMapping("/health")
    public String health() {
        return "Java Backend is Running!";
    }

    /**
     * 接收前端请求并转发给 Python Agent 服务。
     */
    @PostMapping("/itinerary")
    public Mono<PlanResponse> createItinerary(@RequestBody PlanRequest request) {
        return itineraryService.generateItinerary(request);
    }

    /**
     * 查询用户的历史行程单。
     */
    @GetMapping("/history/{userId}")
    public List<Itinerary> getHistory(@PathVariable String userId) {
        return itineraryService.getHistory(userId);
    }

    /**
     * 删除指定的历史行程单。
     */
    @DeleteMapping("/history/{id}")
    public void deleteHistory(@PathVariable Long id) {
        itineraryService.deleteItinerary(id);
    }
}
