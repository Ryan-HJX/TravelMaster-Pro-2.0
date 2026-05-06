package com.travelmaster.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

@Slf4j
@Getter
@Setter
@ConfigurationProperties(prefix = "travelmaster")
public class TravelMasterProperties {

    @PostConstruct
    public void validate() {
        if (jwt.getSecret() == null || jwt.getSecret().contains("dev-secret") || jwt.getSecret().contains("demo")) {
            log.warn("⚠️  JWT_SECRET is using a default/dev value. Set JWT_SECRET environment variable for production!");
        }
        if (internal.getToken() == null || internal.getToken().equals("travelmaster-internal-token")) {
            log.warn("⚠️  INTERNAL_API_TOKEN is using the default value. Set INTERNAL_API_TOKEN environment variable for production!");
        }
    }
    private Jwt jwt = new Jwt();
    private Internal internal = new Internal();
    private Redis redis = new Redis();
    private Ai ai = new Ai();
    private Cors cors = new Cors();

    @Getter
    @Setter
    public static class Jwt {
        private String issuer;
        private String secret;
        private Duration accessTtl = Duration.ofHours(2);
        private Duration refreshTtl = Duration.ofDays(7);
    }

    @Getter
    @Setter
    public static class Internal {
        private String token;
    }

    @Getter
    @Setter
    public static class Redis {
        private String aiTaskStream;
        private String notificationStream;
    }

    @Getter
    @Setter
    public static class Ai {
        private String baseUrl;
        private String compatibilityEndpoint;
    }

    @Getter
    @Setter
    public static class Cors {
        private List<String> allowedOrigins = List.of("http://localhost:3000", "http://localhost:5173");
    }
}
