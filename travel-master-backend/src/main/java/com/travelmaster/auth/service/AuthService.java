package com.travelmaster.auth.service;

import com.travelmaster.auth.dto.AuthResponse;
import com.travelmaster.auth.dto.LoginRequest;
import com.travelmaster.auth.dto.RefreshTokenRequest;
import com.travelmaster.auth.dto.RegisterRequest;
import com.travelmaster.common.exception.AppException;
import com.travelmaster.security.JwtTokenService;
import com.travelmaster.user.dto.UserProfileResponse;
import com.travelmaster.user.entity.AppUser;
import com.travelmaster.user.entity.UserAuth;
import com.travelmaster.user.repository.AppUserRepository;
import com.travelmaster.user.repository.UserAuthRepository;
import com.travelmaster.user.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
public class AuthService {
    private final AppUserRepository appUserRepository;
    private final UserAuthRepository userAuthRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;
    private final StringRedisTemplate redisTemplate;
    private final RateLimitService rateLimitService;

    public AuthService(AppUserRepository appUserRepository,
                       UserAuthRepository userAuthRepository,
                       UserService userService,
                       PasswordEncoder passwordEncoder,
                       JwtTokenService jwtTokenService,
                       StringRedisTemplate redisTemplate,
                       RateLimitService rateLimitService) {
        this.appUserRepository = appUserRepository;
        this.userAuthRepository = userAuthRepository;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
        this.redisTemplate = redisTemplate;
        this.rateLimitService = rateLimitService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request, String ip) {
        rateLimitService.assertWithinLimit("register", request.email(), ip, 10, 30, Duration.ofMinutes(1));
        if ((request.email() == null || request.email().isBlank()) && (request.phone() == null || request.phone().isBlank())) {
            throw new AppException(HttpStatus.BAD_REQUEST, "email or phone is required");
        }
        if (request.email() != null && !request.email().isBlank() && appUserRepository.existsByEmail(request.email())) {
            throw new AppException(HttpStatus.CONFLICT, "email already exists");
        }
        if (request.phone() != null && !request.phone().isBlank() && appUserRepository.existsByPhone(request.phone())) {
            throw new AppException(HttpStatus.CONFLICT, "phone already exists");
        }

        AppUser user = new AppUser();
        user.setEmail(blankToNull(request.email()));
        user.setPhone(blankToNull(request.phone()));
        AppUser savedUser = appUserRepository.save(user);

        UserAuth auth = new UserAuth();
        auth.setUserId(savedUser.getId());
        auth.setPasswordHash(passwordEncoder.encode(request.password()));
        userAuthRepository.save(auth);
        userService.createProfile(savedUser.getId(), request.nickname());

        return issueTokens(savedUser.getId());
    }

    @Transactional
    public AuthResponse login(LoginRequest request, String ip) {
        log.info(">>> [AUTH DEBUG] Login attempt for account: {}", request.account());
        rateLimitService.assertWithinLimit("login", request.account(), ip, 20, 60, Duration.ofMinutes(1));
        
        AppUser user = findUserByAccount(request.account())
                .orElseThrow(() -> {
                    log.error("!!! [AUTH ERROR] User not found: {}", request.account());
                    return new AppException(HttpStatus.UNAUTHORIZED, "invalid credentials");
                });
        
        UserAuth auth = userAuthRepository.findByUserId(user.getId())
                .orElseThrow(() -> {
                    log.error("!!! [AUTH ERROR] Auth record missing for user: {}", user.getId());
                    return new AppException(HttpStatus.UNAUTHORIZED, "invalid credentials");
                });
        
        if (!passwordEncoder.matches(request.password(), auth.getPasswordHash())) {
            log.error("!!! [AUTH ERROR] Password mismatch for user: {}", request.account());
            throw new AppException(HttpStatus.UNAUTHORIZED, "invalid credentials");
        }
        
        auth.setLastLoginAt(LocalDateTime.now());
        userAuthRepository.save(auth);
        log.info(">>> [AUTH SUCCESS] Authentication passed for account: {}. Issuing tokens...", request.account());
        return issueTokens(user.getId());
    }

    public AuthResponse refresh(RefreshTokenRequest request) {
        if (!jwtTokenService.isValid(request.refreshToken(), "refresh")) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "invalid refresh token");
        }
        String userId = jwtTokenService.getUserId(request.refreshToken());
        String cachedRefreshToken = redisTemplate.opsForValue().get(refreshKey(userId));
        if (cachedRefreshToken == null || !cachedRefreshToken.equals(request.refreshToken())) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "refresh token expired");
        }
        return issueTokens(userId);
    }

    private AuthResponse issueTokens(String userId) {
        String accessToken = jwtTokenService.generateAccessToken(userId);
        String refreshToken = jwtTokenService.generateRefreshToken(userId);
        redisTemplate.opsForValue().set(refreshKey(userId), refreshToken, Duration.ofDays(7));
        
        UserProfileResponse profile = userService.getCurrentProfile(userId);
        return new AuthResponse(accessToken, refreshToken, Duration.ofHours(2).toSeconds(), profile);
    }

    private Optional<AppUser> findUserByAccount(String account) {
        return account.contains("@")
                ? appUserRepository.findByEmail(account)
                : appUserRepository.findByPhone(account);
    }

    private String refreshKey(String userId) {
        return "auth:refresh:" + userId;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
