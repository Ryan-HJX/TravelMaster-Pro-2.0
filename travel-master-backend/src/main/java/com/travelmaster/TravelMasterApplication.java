package com.travelmaster;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.core.StringRedisTemplate;
import java.util.Map;

@SpringBootApplication
@EnableCaching
@EnableJpaAuditing
@ConfigurationPropertiesScan
public class TravelMasterApplication {

    public static void main(String[] args) {
        SpringApplication.run(TravelMasterApplication.class, args);
    }

    @Bean
    @Profile("!test")  // Only run in non-test environments
    public CommandLineRunner redisCheck(StringRedisTemplate redisTemplate, com.travelmaster.config.TravelMasterProperties properties) {
        return args -> {
            System.out.println(">>> [REDIS SELF-CHECK] Starting...");
            try {
                String streamKey = properties.getRedis().getAiTaskStream();
                System.out.println(">>> [REDIS SELF-CHECK] Target Stream: " + streamKey);
                redisTemplate.opsForStream().add(MapRecord.create(streamKey, Map.of("ping", "pong", "taskId", "test-ping")));
                System.out.println(">>> [REDIS SELF-CHECK] SUCCESS! Redis is reachable and Stream is writable.");
            } catch (Exception e) {
                System.err.println(">>> [REDIS SELF-CHECK] FAILED!!! Reason: " + e.getMessage());
                e.printStackTrace();
            }
        };
    }
}
