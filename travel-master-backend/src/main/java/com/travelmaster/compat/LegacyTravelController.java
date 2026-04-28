package com.travelmaster.compat;

import com.travelmaster.common.dto.ApiResponse;
import com.travelmaster.itinerary.dto.ItineraryResponse;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/travel")
public class LegacyTravelController {
    private final LegacyTravelService legacyTravelService;

    public LegacyTravelController(LegacyTravelService legacyTravelService) {
        this.legacyTravelService = legacyTravelService;
    }

    @GetMapping("/health")
    public String health() {
        return "TravelMaster Pro Java Backend is Running!";
    }

    @PostMapping("/itinerary")
    public PlanResponse createItinerary(@RequestBody PlanRequest request) {
        return legacyTravelService.createItinerary(request);
    }

    @GetMapping("/history/{userId}")
    public ApiResponse<List<ItineraryResponse>> history(@PathVariable String userId) {
        return ApiResponse.success(legacyTravelService.history(userId));
    }

    @DeleteMapping("/history/{id}")
    public ApiResponse<Void> deleteHistory(@PathVariable String id) {
        return ApiResponse.error(501, "legacy delete is disabled in pro mode");
    }
}
