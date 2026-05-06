package com.travelmaster.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmaster.common.exception.AppException;
import com.travelmaster.config.TravelMasterProperties;
import com.travelmaster.itinerary.dto.CreateTaskRequest;
import com.travelmaster.itinerary.entity.ItineraryGenerationTask;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
@Service
public class AiTaskPublisher {
    private final StringRedisTemplate redisTemplate;
    private final TravelMasterProperties properties;
    private final ObjectMapper objectMapper;

    public AiTaskPublisher(StringRedisTemplate redisTemplate,
                           TravelMasterProperties properties,
                           ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public void publish(ItineraryGenerationTask task, CreateTaskRequest request) {
        log.info("Publishing task to Redis Stream: {} for taskId: {}", properties.getRedis().getAiTaskStream(), task.getId());
        Map<String, String> payload = new LinkedHashMap<>();
        payload.put("taskId", task.getId());
        payload.put("userId", task.getUserId());
        payload.put("traceId", task.getTraceId());
        payload.put("promptVersion", task.getPromptVersion());
        payload.put("userInput", task.getUserInput());
        payload.put("preferences", toJson(request.preferences()));
        payload.put("travelConstraints", toJson(request.travelConstraints()));
        try {
            redisTemplate.opsForStream().add(MapRecord.create(properties.getRedis().getAiTaskStream(), payload));
            log.info("Successfully added record to Redis Stream for taskId: {}", task.getId());
        } catch (Exception e) {
            log.error("Failed to publish task {} to Redis: {}", task.getId(), e.getMessage());
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "failed to publish AI task");
        }
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value == null ? Map.of() : value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
