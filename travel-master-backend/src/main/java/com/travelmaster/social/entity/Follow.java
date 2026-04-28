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
@Table(name = "follows")
public class Follow extends BaseEntity {

    @Column(name = "follower_id", nullable = false, length = 36)
    private String followerId;

    @Column(name = "followee_id", nullable = false, length = 36)
    private String followeeId;
}
