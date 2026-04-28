package com.travelmaster.auth.controller;

import com.travelmaster.auth.dto.AuthResponse;
import com.travelmaster.auth.dto.LoginRequest;
import com.travelmaster.auth.dto.RefreshTokenRequest;
import com.travelmaster.auth.dto.RegisterRequest;
import com.travelmaster.auth.service.AuthService;
import com.travelmaster.common.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        return ApiResponse.success(authService.register(request, httpRequest.getRemoteAddr()));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return ApiResponse.success(authService.login(request, httpRequest.getRemoteAddr()));
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.success(authService.refresh(request));
    }
}
