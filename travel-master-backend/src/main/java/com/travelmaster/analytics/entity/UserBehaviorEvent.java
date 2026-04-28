package com.travelmaster.analytics.entity;

import com.travelmaster.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "user_behavior_events")
public class UserBehaviorEvent extends BaseEntity {

    @Column(name = "user_id", length = 36)
    private String userId;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "resource_type", length = 50)
    private String resourceType;

    @Column(name = "resource_id", length = 36)
    private String resourceId;

    @Column(columnDefinition = "TEXT")
    private String payload;
}
