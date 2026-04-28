package com.travelmaster.user.controller;

import com.travelmaster.common.dto.ApiResponse;
import com.travelmaster.security.AuthenticatedUser;
import com.travelmaster.user.dto.UpdateUserProfileRequest;
import com.travelmaster.user.dto.UserProfileResponse;
import com.travelmaster.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ApiResponse<UserProfileResponse> currentUser(@AuthenticationPrincipal AuthenticatedUser currentUser) {
        return ApiResponse.success(userService.getCurrentProfile(currentUser.userId()));
    }

    @PutMapping("/me")
    public ApiResponse<UserProfileResponse> updateCurrentUser(@AuthenticationPrincipal AuthenticatedUser currentUser,
                                                              @Valid @RequestBody UpdateUserProfileRequest request) {
        return ApiResponse.success(userService.updateProfile(currentUser.userId(), request));
    }
}
