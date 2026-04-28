package com.travelmaster.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmaster.config.TravelMasterProperties;
import com.travelmaster.itinerary.dto.CreateTaskRequest;
import com.travelmaster.itinerary.entity.ItineraryGenerationTask;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

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
        System.out.println("[DEBUG] Publishing task to Redis Stream: " + properties.getRedis().getAiTaskStream() + " for taskId: " + task.getId());
        Map<String, String> payload = new LinkedHashMap<>();
        payload.put("taskId", task.getId());
        payload.put("userId", task.getUserId());
        payload.put("traceId", task.getTraceId());
        payload.put("promptVersion", task.getPromptVersion());
        payload.put("userInput", task.getUserInput());
        payload.put("preferences", toJson(request.preferences()));
        payload.put("travelConstraints", toJson(request.travelConstraints()));
        try {
            System.out.println("[DEBUG] Attempting to add record to Redis Stream...");
            redisTemplate.opsForStream().add(MapRecord.create(properties.getRedis().getAiTaskStream(), payload));
            System.out.println("[DEBUG] Successfully added record to Redis Stream!");
        } catch (Exception e) {
            System.err.println("[ERROR] Failed to publish task to Redis: " + e.getMessage());
            e.printStackTrace();
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
