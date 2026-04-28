package com.travelmaster.social.dto;

import java.time.LocalDateTime;

public record CommentResponse(
        String commentId,
        String content,
        String parentId,
        String userId,
        String nickname,
        LocalDateTime createdAt
) {
}
