package com.travelmaster.auth.service;

import com.travelmaster.common.exception.AppException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class RateLimitService {
    private final StringRedisTemplate redisTemplate;

    public RateLimitService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void assertWithinLimit(String action,
                                  String userKey,
                                  String ip,
                                  int userLimit,
                                  int ipLimit,
                                  Duration window) {
        if (userKey != null && !userKey.isBlank()) {
            incrementOrThrow("rate:" + action + ":user:" + userKey, userLimit, window);
        }
        if (ip != null && !ip.isBlank()) {
            incrementOrThrow("rate:" + action + ":ip:" + ip, ipLimit, window);
        }
    }

    private void incrementOrThrow(String key, int limit, Duration window) {
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1) {
            redisTemplate.expire(key, window);
        }
        if (count != null && count > limit) {
            throw new AppException(HttpStatus.TOO_MANY_REQUESTS, "rate limit exceeded");
        }
    }
}
