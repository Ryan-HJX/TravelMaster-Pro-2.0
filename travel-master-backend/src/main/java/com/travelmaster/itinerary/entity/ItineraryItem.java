package com.travelmaster.itinerary.entity;

import com.travelmaster.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "itinerary_items")
public class ItineraryItem extends BaseEntity {

    @Column(name = "itinerary_id", nullable = false, length = 36)
    private String itineraryId;

    @Column(name = "day_number", nullable = false)
    private Integer dayNumber;

    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber;

    @Column(name = "item_title", nullable = false, length = 200)
    private String itemTitle;

    @Column(name = "activity_type", length = 50)
    private String activityType;

    @Column(length = 255)
    private String address;

    @Column(name = "start_time", length = 20)
    private String startTime;

    @Column(name = "end_time", length = 20)
    private String endTime;

    @Column(name = "transport_mode", length = 50)
    private String transportMode;

    @Column(name = "transport_duration_minutes")
    private Integer transportDurationMinutes;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
