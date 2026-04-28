package com.travelmaster.social.entity;

import com.travelmaster.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "post_favorites")
public class PostFavorite extends BaseEntity {

    @Column(name = "post_id", nullable = false, length = 36)
    private String postId;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;
}
