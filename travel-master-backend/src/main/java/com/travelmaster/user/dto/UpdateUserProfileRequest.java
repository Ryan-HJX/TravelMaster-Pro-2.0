package com.travelmaster.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateUserProfileRequest(
        @NotBlank(message = "nickname is required")
        @Size(max = 64, message = "nickname too long")
        String nickname,
        @Size(max = 500, message = "bio too long")
        String bio,
        String avatarUrl,
        List<String> preferenceTags
) {
}
