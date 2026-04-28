package com.travelmaster.user.entity;

import com.travelmaster.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "user_profile")
public class UserProfile extends BaseEntity {

    @Column(name = "user_id", nullable = false, unique = true, length = 36)
    private String userId;

    @Column(nullable = false, length = 64)
    private String nickname;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "preference_tags", columnDefinition = "TEXT")
    private String preferenceTags;
}
