package com.travelmaster.auth.controller;

import com.travelmaster.auth.dto.AuthResponse;
import com.travelmaster.auth.dto.LoginRequest;
import com.travelmaster.auth.dto.RefreshTokenRequest;
import com.travelmaster.auth.dto.RegisterRequest;
import com.travelmaster.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 认证控制器
 * 
 * 提供用户注册、登录、刷新 Token 等认证相关接口
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "认证模块", description = "用户注册、登录、Token 管理相关接口")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(
        summary = "用户注册",
        description = "使用邮箱和密码注册新账号，注册成功后自动登录并返回 JWT Token"
    )
    public com.travelmaster.common.dto.ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        return com.travelmaster.common.dto.ApiResponse.success(authService.register(request, httpRequest.getRemoteAddr()));
    }

    @PostMapping("/login")
    @Operation(
        summary = "用户登录",
        description = "使用账号（邮箱）和密码登录，返回 JWT Access Token 和 Refresh Token"
    )
    public com.travelmaster.common.dto.ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return com.travelmaster.common.dto.ApiResponse.success(authService.login(request, httpRequest.getRemoteAddr()));
    }

    @PostMapping("/refresh")
    @Operation(
        summary = "刷新 Token",
        description = "使用 Refresh Token 获取新的 Access Token，实现无感刷新"
    )
    public com.travelmaster.common.dto.ApiResponse<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return com.travelmaster.common.dto.ApiResponse.success(authService.refresh(request));
    }
}
