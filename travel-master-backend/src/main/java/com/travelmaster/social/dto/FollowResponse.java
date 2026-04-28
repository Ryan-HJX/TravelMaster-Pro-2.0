package com.travelmaster.social.dto;

public record FollowResponse(String followerId, String followeeId, boolean following) {
}
