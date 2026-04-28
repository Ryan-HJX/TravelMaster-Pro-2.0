package com.travelmaster.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@Getter
@Setter
@ConfigurationProperties(prefix = "travelmaster")
public class TravelMasterProperties {
    private Jwt jwt = new Jwt();
    private Internal internal = new Internal();
    private Redis redis = new Redis();
    private Ai ai = new Ai();

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
}
