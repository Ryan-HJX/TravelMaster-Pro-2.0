package com.travelmaster.security;

import com.travelmaster.config.TravelMasterProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

@Service
public class JwtTokenService {
    private final TravelMasterProperties properties;
    private final SecretKey secretKey;

    public JwtTokenService(TravelMasterProperties properties) {
        this.properties = properties;
        this.secretKey = Keys.hmacShaKeyFor(properties.getJwt().getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(String userId) {
        return generateToken(userId, "access", properties.getJwt().getAccessTtl().toSeconds());
    }

    public String generateRefreshToken(String userId) {
        return generateToken(userId, "refresh", properties.getJwt().getRefreshTtl().toSeconds());
    }

    private String generateToken(String userId, String tokenType, long ttlSeconds) {
        Instant now = Instant.now();
        return Jwts.builder()
                .issuer(properties.getJwt().getIssuer())
                .subject(userId)
                .claims(Map.of("token_type", tokenType))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(ttlSeconds)))
                .signWith(secretKey)
                .compact();
    }

    public String getUserId(String token) {
        return parseClaims(token).getSubject();
    }

    public String getTokenType(String token) {
        return parseClaims(token).get("token_type", String.class);
    }

    public boolean isValid(String token, String expectedType) {
        Claims claims = parseClaims(token);
        return expectedType.equals(claims.get("token_type", String.class))
                && claims.getExpiration().after(new Date());
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
