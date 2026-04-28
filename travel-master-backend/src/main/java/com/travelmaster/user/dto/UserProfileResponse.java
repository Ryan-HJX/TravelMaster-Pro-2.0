package com.travelmaster.user.dto;

import com.travelmaster.user.entity.MembershipTier;

import java.util.List;

public record UserProfileResponse(
        String userId,
        String email,
        String phone,
        String nickname,
        String avatarUrl,
        String bio,
        MembershipTier membershipTier,
        Integer level,
        Integer points,
        List<String> preferenceTags
) {
}
