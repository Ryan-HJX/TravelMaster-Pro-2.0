package com.travelmaster.config;

import org.redisson.api.RedissonClient;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StreamOperations;
import org.springframework.data.redis.core.StringRedisTemplate;

import static org.mockito.Mockito.*;

/**
 * Test configuration to mock Redis dependencies.
 * This prevents the need for a real Redis instance during unit tests.
 */
@TestConfiguration
public class TestRedisConfig {

    @Bean
    @Primary
    public RedisConnectionFactory redisConnectionFactory() {
        return mock(RedisConnectionFactory.class);
    }

    @Bean
    @Primary
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        StringRedisTemplate template = mock(StringRedisTemplate.class);
        StreamOperations<String, Object, Object> streamOps = mock(StreamOperations.class);
        when(template.opsForStream()).thenReturn(streamOps);
        return template;
    }

    @Bean
    @Primary
    public RedissonClient redissonClient() {
        return mock(RedissonClient.class);
    }

    @Bean
    @Primary
    public CacheManager cacheManager() {
        // Use a simple in-memory cache manager for tests to avoid Redis dependency
        return new ConcurrentMapCacheManager("userProfile_v3", "postFeed", "postDetail", "creatorRanking", "hotItineraries");
    }

    @Bean
    @Primary
    public CommandLineRunner disableRedisCheck() {
        // Override the redisCheck bean from TravelMasterApplication to prevent Redis connection attempts
        return args -> {
            System.out.println(">>> [TEST MODE] Redis check skipped in test environment");
        };
    }
}
