package com.travelmaster.social.dto;

import java.time.LocalDateTime;

public record PostResponse(
        String postId,
        String itineraryId,
        String title,
        String contentExcerpt,
        Integer likeCount,
        Integer favoriteCount,
        Integer commentCount,
        boolean liked,
        boolean favorited,
        AuthorSummaryResponse author,
        LocalDateTime publishedAt
) {
}
