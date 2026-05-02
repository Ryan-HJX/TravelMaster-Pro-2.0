package com.travelmaster.notification.controller;

import com.travelmaster.common.dto.ApiResponse;
import com.travelmaster.notification.dto.NotificationResponse;
import com.travelmaster.notification.service.NotificationService;
import com.travelmaster.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 通知控制器
 * 
 * 提供用户通知查询和标记已读功能
 */
@RestController
@RequestMapping("/api/notifications")
@Tag(name = "通知模块", description = "用户通知管理相关接口")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(
        summary = "获取通知列表",
        description = "分页获取当前用户的通知列表，包括点赞、评论、关注等通知"
    )
    public ApiResponse<List<NotificationResponse>> list(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Parameter(description = "页码，从 0 开始", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页数量", example = "20")
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(notificationService.listNotifications(currentUser.userId(), page, size));
    }

    @PostMapping("/{id}/read")
    @Operation(
        summary = "标记通知为已读",
        description = "将指定通知标记为已读状态"
    )
    public ApiResponse<NotificationResponse> markRead(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Parameter(description = "通知 ID", example = "notif-123")
            @PathVariable String id) {
        return ApiResponse.success(notificationService.markRead(currentUser.userId(), id));
    }
}
