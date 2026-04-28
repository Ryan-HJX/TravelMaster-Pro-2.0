package com.travelmaster.auth.dto;

import com.travelmaster.user.dto.UserProfileResponse;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        long accessTokenExpiresInSeconds,
        UserProfileResponse user
) {
}
