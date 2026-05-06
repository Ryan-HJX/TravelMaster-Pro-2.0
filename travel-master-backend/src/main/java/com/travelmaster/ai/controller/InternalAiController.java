package com.travelmaster.ai.controller;

import com.travelmaster.ai.dto.AiTaskResultRequest;
import com.travelmaster.common.dto.ApiResponse;
import com.travelmaster.config.TravelMasterProperties;
import com.travelmaster.itinerary.dto.TaskResponse;
import com.travelmaster.itinerary.service.ItineraryTaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@RestController
@RequestMapping("/api/internal/ai/tasks")
public class InternalAiController {
    private final ItineraryTaskService itineraryTaskService;
    private final TravelMasterProperties properties;

    public InternalAiController(ItineraryTaskService itineraryTaskService, TravelMasterProperties properties) {
        this.itineraryTaskService = itineraryTaskService;
        this.properties = properties;
    }

    @PostMapping("/{taskId}/complete")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<TaskResponse> complete(@PathVariable String taskId,
                                              @RequestHeader("X-Internal-Token") String token,
                                              @Valid @RequestBody AiTaskResultRequest request) {
        String expected = properties.getInternal().getToken();
        if (expected == null || expected.isBlank() ||
                !MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), token.getBytes(StandardCharsets.UTF_8))) {
            throw new com.travelmaster.common.exception.AppException(HttpStatus.UNAUTHORIZED, "invalid internal token");
        }
        return ApiResponse.success(itineraryTaskService.completeTask(taskId, request));
    }
}
