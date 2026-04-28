package com.travelmaster.notification.controller;

import com.travelmaster.common.dto.ApiResponse;
import com.travelmaster.notification.dto.NotificationResponse;
import com.travelmaster.notification.service.NotificationService;
import com.travelmaster.security.AuthenticatedUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ApiResponse<List<NotificationResponse>> list(@AuthenticationPrincipal AuthenticatedUser currentUser,
                                                        @RequestParam(defaultValue = "0") int page,
                                                        @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(notificationService.listNotifications(currentUser.userId(), page, size));
    }

    @PostMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markRead(@AuthenticationPrincipal AuthenticatedUser currentUser,
                                                      @PathVariable String id) {
        return ApiResponse.success(notificationService.markRead(currentUser.userId(), id));
    }
}
