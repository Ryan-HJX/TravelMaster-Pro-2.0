package com.travelmaster.common.dto;

import java.time.Instant;

public record ApiResponse<T>(
        int code,
        String message,
        T data,
        Instant timestamp
) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, "success", data, Instant.now());
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(200, message, data, Instant.now());
    }

    public static ApiResponse<Void> error(int code, String message) {
        return new ApiResponse<>(code, message, null, Instant.now());
    }
}
