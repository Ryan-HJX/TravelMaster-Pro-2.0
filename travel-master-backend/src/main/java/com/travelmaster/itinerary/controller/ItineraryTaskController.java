package com.travelmaster.itinerary.controller;

import com.travelmaster.common.dto.ApiResponse;
import com.travelmaster.itinerary.dto.CreateTaskRequest;
import com.travelmaster.itinerary.dto.PublishItineraryRequest;
import com.travelmaster.itinerary.dto.TaskResponse;
import com.travelmaster.itinerary.service.ItineraryTaskService;
import com.travelmaster.security.AuthenticatedUser;
import com.travelmaster.social.dto.PostResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.Parameter;
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

/**
 * 行程任务控制器
 * 
 * 提供 AI 行程生成任务的创建、查询，以及行程发布功能
 */
@RestController
@RequestMapping("/api")
@Tag(name = "行程任务模块", description = "AI 行程规划任务管理、行程发布相关接口")
public class ItineraryTaskController {
    private final ItineraryTaskService itineraryTaskService;

    public ItineraryTaskController(ItineraryTaskService itineraryTaskService) {
        this.itineraryTaskService = itineraryTaskService;
    }

    @PostMapping("/itinerary-tasks")
    @Operation(
        summary = "创建 AI 行程生成任务",
        description = "提交旅行需求，后端将异步调用 Python AI 服务生成行程。支持幂等性控制（Idempotency-Key）。"
    )
    public ApiResponse<TaskResponse> createTask(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestHeader(value = "X-User-Id", required = false) String userIdFromHeader,
            @Valid @RequestBody CreateTaskRequest request,
            @Parameter(description = "幂等性 Key，防止重复提交", example = "uuid-v4-string")
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest httpRequest) {
        String userId = currentUser != null ? currentUser.userId() : userIdFromHeader;
        System.out.println(">>> [FRONTEND REQUEST] Received /api/itinerary-tasks for user: " + userId + " input: " + request.userInput());
        return ApiResponse.success(itineraryTaskService.createTask(
                userId,
                request,
                idempotencyKey,
                httpRequest.getRemoteAddr()
        ));
    }

    @GetMapping("/itinerary-tasks/{taskId}")
    @Operation(
        summary = "查询行程任务状态",
        description = "根据任务 ID 查询 AI 行程生成的进度和结果。前端应轮询此接口直到任务完成。"
    )
    public ApiResponse<TaskResponse> getTask(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestHeader(value = "X-User-Id", required = false) String userIdFromHeader,
            @Parameter(description = "任务 ID", example = "task-123456")
            @PathVariable String taskId) {
        String userId = currentUser != null ? currentUser.userId() : userIdFromHeader;
        return ApiResponse.success(itineraryTaskService.getTask(userId, taskId));
    }

    @GetMapping("/itineraries")
    public ApiResponse<java.util.List<com.travelmaster.itinerary.dto.ItineraryResponse>> getHistory(@AuthenticationPrincipal AuthenticatedUser currentUser) {
        java.util.List<com.travelmaster.itinerary.dto.ItineraryResponse> history = itineraryTaskService.history(currentUser.userId());
        System.out.println(">>> [HISTORY] User: " + currentUser.userId() + " found " + history.size() + " records");
        return ApiResponse.success(history);
    }

    @GetMapping("/itineraries/{id}")
    public ApiResponse<com.travelmaster.itinerary.dto.ItineraryResponse> getItinerary(@AuthenticationPrincipal AuthenticatedUser currentUser,
                                                                                       @PathVariable String id) {
        return ApiResponse.success(itineraryTaskService.getItinerary(currentUser.userId(), id));
    }

    @PostMapping("/itineraries/{id}/publish")
    public ApiResponse<PostResponse> publish(@AuthenticationPrincipal AuthenticatedUser currentUser,
                                             @PathVariable String id,
                                             @Valid @RequestBody PublishItineraryRequest request) {
        return ApiResponse.success(itineraryTaskService.publish(currentUser.userId(), id, request));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/itineraries/{id}")
    public ApiResponse<Void> deleteItinerary(@AuthenticationPrincipal AuthenticatedUser currentUser,
                                             @PathVariable String id) {
        itineraryTaskService.deleteItinerary(currentUser.userId(), id);
        return ApiResponse.success(null);
    }
}
