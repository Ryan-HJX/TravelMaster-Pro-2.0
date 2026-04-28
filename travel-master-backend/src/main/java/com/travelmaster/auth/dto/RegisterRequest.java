package com.travelmaster.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @Email(message = "invalid email")
        String email,
        @Pattern(regexp = "^$|^\\+?[0-9\\-]{6,20}$", message = "invalid phone")
        String phone,
        @NotBlank(message = "password is required")
        @Size(min = 6, max = 64, message = "password length must be between 6 and 64")
        String password,
        @NotBlank(message = "nickname is required")
        @Size(max = 64, message = "nickname too long")
        String nickname
) {
}
