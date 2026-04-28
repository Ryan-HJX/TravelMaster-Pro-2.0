package com.travelmaster.itinerary.entity;

import com.travelmaster.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "itinerary_generation_task")
public class ItineraryGenerationTask extends BaseEntity {

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "user_input", nullable = false, columnDefinition = "TEXT")
    private String userInput;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TaskStatus status = TaskStatus.PENDING;

    @Column(name = "prompt_version", nullable = false, length = 50)
    private String promptVersion;

    @Column(name = "trace_id", nullable = false, length = 64)
    private String traceId;

    @Column(name = "request_payload", nullable = false, columnDefinition = "TEXT")
    private String requestPayload;

    @Column(name = "result_payload", columnDefinition = "TEXT")
    private String resultPayload;

    @Column(name = "failure_reason", columnDefinition = "TEXT")
    private String failureReason;

    @Column(name = "idempotency_key", nullable = false, length = 100)
    private String idempotencyKey;

    @Column(name = "itinerary_id", length = 36)
    private String itineraryId;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
