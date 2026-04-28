package com.travelmaster.itinerary.controller;

import com.travelmaster.common.dto.ApiResponse;
import com.travelmaster.itinerary.dto.CreateTaskRequest;
import com.travelmaster.itinerary.dto.PublishItineraryRequest;
import com.travelmaster.itinerary.dto.TaskResponse;
import com.travelmaster.itinerary.service.ItineraryTaskService;
import com.travelmaster.security.AuthenticatedUser;
import com.travelmaster.social.dto.PostResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ItineraryTaskController {
    private final ItineraryTaskService itineraryTaskService;

    public ItineraryTaskController(ItineraryTaskService itineraryTaskService) {
        this.itineraryTaskService = itineraryTaskService;
    }

    @PostMapping("/itinerary-tasks")
    public ApiResponse<TaskResponse> createTask(@AuthenticationPrincipal AuthenticatedUser currentUser,
                                                @Valid @RequestBody CreateTaskRequest request,
                                                @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
                                                HttpServletRequest httpRequest) {
        return ApiResponse.success(itineraryTaskService.createTask(
                currentUser.userId(),
                request,
                idempotencyKey,
                httpRequest.getRemoteAddr()
        ));
    }

    @GetMapping("/itinerary-tasks/{taskId}")
    public ApiResponse<TaskResponse> getTask(@AuthenticationPrincipal AuthenticatedUser currentUser,
                                             @PathVariable String taskId) {
        return ApiResponse.success(itineraryTaskService.getTask(currentUser.userId(), taskId));
    }

    @PostMapping("/itineraries/{id}/publish")
    public ApiResponse<PostResponse> publish(@AuthenticationPrincipal AuthenticatedUser currentUser,
                                             @PathVariable String id,
                                             @Valid @RequestBody PublishItineraryRequest request) {
        return ApiResponse.success(itineraryTaskService.publish(currentUser.userId(), id, request));
    }
}
