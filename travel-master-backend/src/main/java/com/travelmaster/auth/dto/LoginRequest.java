package com.travelmaster.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "account is required")
        String account,
        @NotBlank(message = "password is required")
        String password
) {
}
