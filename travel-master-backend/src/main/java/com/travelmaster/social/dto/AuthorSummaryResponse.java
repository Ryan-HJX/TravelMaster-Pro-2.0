package com.travelmaster.social.dto;

public record AuthorSummaryResponse(
        String userId,
        String nickname,
        String avatarUrl,
        boolean following
) {
}
