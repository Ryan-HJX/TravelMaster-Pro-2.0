package com.travelmaster.itinerary.entity;

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
@Table(name = "itineraries")
public class Itinerary extends BaseEntity {

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "task_id", nullable = false, unique = true, length = 36)
    private String taskId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(name = "risk_tips", columnDefinition = "TEXT")
    private String riskTips;

    @Column(name = "rendered_markdown", columnDefinition = "LONGTEXT")
    private String renderedMarkdown;

    @Column(name = "structured_content", columnDefinition = "LONGTEXT")
    private String structuredContent;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    // ── 2.0 enhancements ─────────────────────────────────────
    @Column(name = "start_location", length = 200)
    private String startLocation;

    @Column(name = "end_location", length = 200)
    private String endLocation;

    @Column(name = "travel_mode_preference", length = 30)
    private String travelModePreference;

    @Column(name = "weather_summary", columnDefinition = "TEXT")
    private String weatherSummary;

    @Column(name = "finance_summary", columnDefinition = "TEXT")
    private String financeSummary;

    @Column(name = "planning_score", length = 20)
    private String planningScore;
}
