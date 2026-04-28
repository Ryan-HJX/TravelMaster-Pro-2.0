package com.travelmaster.analytics.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmaster.analytics.entity.UserBehaviorEvent;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class BehaviorEventService {
    private final BehaviorEventRepository repository;
    private final ObjectMapper objectMapper;

    public BehaviorEventService(BehaviorEventRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public void log(String userId, String eventType, String resourceType, String resourceId, Map<String, Object> payload) {
        UserBehaviorEvent event = new UserBehaviorEvent();
        event.setUserId(userId);
        event.setEventType(eventType);
        event.setResourceType(resourceType);
        event.setResourceId(resourceId);
        event.setPayload(writeJson(payload));
        repository.save(event);
    }

    private String writeJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload == null ? Map.of() : payload);
        } catch (JsonProcessingException exception) {
            return "{}";
        }
    }
}
