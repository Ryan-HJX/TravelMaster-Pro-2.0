package com.travelmaster.social.entity;

import com.travelmaster.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "posts")
public class Post extends BaseEntity {

    @Column(name = "itinerary_id", nullable = false, unique = true, length = 36)
    private String itineraryId;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "content_excerpt", columnDefinition = "TEXT")
    private String contentExcerpt;

    @Column(name = "like_count", nullable = false)
    private Integer likeCount = 0;

    @Column(name = "favorite_count", nullable = false)
    private Integer favoriteCount = 0;

    @Column(name = "comment_count", nullable = false)
    private Integer commentCount = 0;

    @Column(name = "published_at", nullable = false)
    private LocalDateTime publishedAt;
}
