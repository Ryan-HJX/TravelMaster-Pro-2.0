package com.travelmaster.social.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentRequest(
        String parentId,
        @NotBlank(message = "content is required")
        @Size(max = 500, message = "comment too long")
        String content
) {
}
