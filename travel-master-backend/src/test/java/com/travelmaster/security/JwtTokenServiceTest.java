package com.travelmaster.security;

import com.travelmaster.config.TravelMasterProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenServiceTest {

    private JwtTokenService jwtTokenService;
    private SecretKey secretKey;
    private static final String JWT_SECRET = "travelmaster-secret-key-32-character-min";

    @BeforeEach
    void setUp() {
        TravelMasterProperties properties = new TravelMasterProperties();
        properties.getJwt().setSecret(JWT_SECRET);
        jwtTokenService = new JwtTokenService(properties);
        secretKey = Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    @DisplayName("generateAccessToken - success generates valid token")
    void generateAccessToken_success() {
        String userId = "user-001";
        String token = jwtTokenService.generateAccessToken(userId);

        assertNotNull(token);
        assertFalse(token.isBlank());
        
        Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        
        assertEquals(userId, claims.getSubject());
        assertEquals("access", claims.get("token_type"));
    }

    @Test
    @DisplayName("generateRefreshToken - success generates valid token")
    void generateRefreshToken_success() {
        String userId = "user-001";
        String token = jwtTokenService.generateRefreshToken(userId);

        assertNotNull(token);
        assertFalse(token.isBlank());
        
        Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        
        assertEquals(userId, claims.getSubject());
        assertEquals("refresh", claims.get("token_type"));
    }

    @Test
    @DisplayName("isValid - valid token returns true")
    void isValid_validToken_returnsTrue() {
        String token = jwtTokenService.generateAccessToken("user-001");
        assertTrue(jwtTokenService.isValid(token, "access"));
    }

    @Test
    @DisplayName("isValid - invalid type returns false")
    void isValid_wrongType_returnsFalse() {
        String token = jwtTokenService.generateAccessToken("user-001");
        assertFalse(jwtTokenService.isValid(token, "refresh"));
    }

    @Test
    @DisplayName("isValid - expired token throws exception")
    void isValid_expiredToken_throwsException() {
        String expiredToken = Jwts.builder()
                .subject("user-001")
                .claim("token_type", "access")
                .expiration(new Date(System.currentTimeMillis() - 1000))
                .signWith(secretKey)
                .compact();
        
        assertThrows(Exception.class, () -> jwtTokenService.isValid(expiredToken, "access"));
    }

    @Test
    @DisplayName("getUserId - success extracts user ID")
    void getUserId_success() {
        String userId = "user-001";
        String token = jwtTokenService.generateAccessToken(userId);
        
        String extractedUserId = jwtTokenService.getUserId(token);
        assertEquals(userId, extractedUserId);
    }
}