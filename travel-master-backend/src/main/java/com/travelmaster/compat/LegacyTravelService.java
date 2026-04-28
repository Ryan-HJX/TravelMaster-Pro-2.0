package com.travelmaster.compat;

import com.travelmaster.common.exception.AppException;
import com.travelmaster.config.TravelMasterProperties;
import com.travelmaster.itinerary.dto.CreateTaskRequest;
import com.travelmaster.itinerary.dto.ItineraryResponse;
import com.travelmaster.itinerary.dto.TaskResponse;
import com.travelmaster.itinerary.service.ItineraryTaskService;
import com.travelmaster.itinerary.entity.TaskStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
public class LegacyTravelService {
    private final ItineraryTaskService itineraryTaskService;
    private final WebClient webClient;
    private final TravelMasterProperties properties;

    public LegacyTravelService(ItineraryTaskService itineraryTaskService, TravelMasterProperties properties) {
        this.itineraryTaskService = itineraryTaskService;
        this.properties = properties;
        this.webClient = WebClient.builder().baseUrl(properties.getAi().getBaseUrl()).build();
    }

    public PlanResponse createItinerary(PlanRequest request) {
        try {
            PlanResponse response = webClient.post()
                    .uri(properties.getAi().getCompatibilityEndpoint())
                    .bodyValue(Map.of(
                            "user_input", request.query(),
                            "preferences", Map.of("user_id", request.userId())
                    ))
                    .retrieve()
                    .bodyToMono(PlanResponse.class)
                    .block();
            if (response == null) {
                throw new AppException(HttpStatus.BAD_GATEWAY, "python service returned empty response");
            }
            return response;
        } catch (Exception exception) {
            throw new AppException(HttpStatus.BAD_GATEWAY, "legacy compatibility call failed: " + exception.getMessage());
        }
    }

    public List<ItineraryResponse> history(String userId) {
        return itineraryTaskService.history(userId);
    }

    public void deleteItinerary(String userId, String itineraryId) {
        TaskResponse response = itineraryTaskService.getTask(userId, itineraryId);
        if (response.status() != TaskStatus.COMPLETED) {
            throw new AppException(HttpStatus.BAD_REQUEST, "legacy deletion only supports completed itineraries");
        }
        throw new AppException(HttpStatus.NOT_IMPLEMENTED, "legacy delete is not implemented in pro mode");
    }
}
