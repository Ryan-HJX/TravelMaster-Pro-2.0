package com.travelmaster.analytics.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {
    private final JdbcTemplate jdbcTemplate;

    public AnalyticsService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Map<String, Object> overview() {
        String sql = """
                SELECT
                    (SELECT COUNT(*) FROM users) AS user_count,
                    (SELECT COUNT(*) FROM itinerary_generation_task) AS task_count,
                    (SELECT COUNT(*) FROM itinerary_generation_task WHERE status = 'COMPLETED') AS completed_task_count,
                    (SELECT COUNT(*) FROM posts) AS post_count,
                    (SELECT COUNT(*) FROM comments) AS comment_count,
                    (SELECT COUNT(*) FROM notifications WHERE read_status = FALSE) AS unread_notification_count
                """;
        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("userCount", rs.getLong("user_count"));
            result.put("taskCount", rs.getLong("task_count"));
            result.put("completedTaskCount", rs.getLong("completed_task_count"));
            result.put("postCount", rs.getLong("post_count"));
            result.put("commentCount", rs.getLong("comment_count"));
            result.put("unreadNotificationCount", rs.getLong("unread_notification_count"));
            return result;
        });
    }

    public Map<String, Object> funnel() {
        String sql = """
                SELECT
                    SUM(CASE WHEN event_type = 'TASK_CREATED' THEN 1 ELSE 0 END) AS task_created,
                    SUM(CASE WHEN event_type = 'TASK_COMPLETED' THEN 1 ELSE 0 END) AS task_completed,
                    SUM(CASE WHEN event_type = 'POST_PUBLISHED' THEN 1 ELSE 0 END) AS post_published
                FROM user_behavior_events
                """;
        return jdbcTemplate.queryForObject(sql, (rs, rowNum) -> {
            long created = rs.getLong("task_created");
            long completed = rs.getLong("task_completed");
            long published = rs.getLong("post_published");
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("taskCreated", created);
            result.put("taskCompleted", completed);
            result.put("postPublished", published);
            result.put("taskCompletionRate", created == 0 ? 0D : (double) completed / created);
            result.put("publishConversionRate", completed == 0 ? 0D : (double) published / completed);
            return result;
        });
    }

    public List<Map<String, Object>> destinations() {
        String sql = """
                SELECT title AS destination, COUNT(*) AS trip_count
                FROM itineraries
                WHERE title IS NOT NULL
                GROUP BY title
                ORDER BY trip_count DESC
                LIMIT 10
                """;
        return jdbcTemplate.query(sql, (rs, rowNum) -> Map.of(
                "destination", rs.getString("destination"),
                "tripCount", rs.getLong("trip_count")
        ));
    }
}
