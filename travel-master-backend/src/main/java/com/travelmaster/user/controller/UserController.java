package com.travelmaster.user.controller;

import com.travelmaster.common.dto.ApiResponse;
import com.travelmaster.security.AuthenticatedUser;
import com.travelmaster.user.dto.UpdateUserProfileRequest;
import com.travelmaster.user.dto.UserProfileResponse;
import com.travelmaster.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户控制器
 * 
 * 提供用户资料查询和更新功能
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "用户模块", description = "用户资料管理相关接口")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @Operation(
        summary = "获取当前用户资料",
        description = "查询当前登录用户的详细信息，包括昵称、头像、偏好标签等"
    )
    public ApiResponse<UserProfileResponse> currentUser(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestHeader(value = "X-User-Id", required = false) String userIdFromHeader) {
        String userId = currentUser != null ? currentUser.userId() : userIdFromHeader;
        return ApiResponse.success(userService.getCurrentProfile(userId));
    }

    @PutMapping("/me")
    @Operation(
        summary = "更新当前用户资料",
        description = "修改当前用户的昵称、头像、旅行偏好等信息"
    )
    public ApiResponse<UserProfileResponse> updateCurrentUser(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestHeader(value = "X-User-Id", required = false) String userIdFromHeader,
            @Valid @RequestBody UpdateUserProfileRequest request) {
        String userId = currentUser != null ? currentUser.userId() : userIdFromHeader;
        return ApiResponse.success(userService.updateProfile(userId, request));
    }
}
