package com.travelmaster.auth;

import com.travelmaster.auth.dto.AuthResponse;
import com.travelmaster.auth.dto.LoginRequest;
import com.travelmaster.auth.dto.RefreshTokenRequest;
import com.travelmaster.auth.dto.RegisterRequest;
import com.travelmaster.auth.service.AuthService;
import com.travelmaster.auth.service.RateLimitService;
import com.travelmaster.common.exception.AppException;
import com.travelmaster.security.JwtTokenService;
import com.travelmaster.user.dto.UserProfileResponse;
import com.travelmaster.user.entity.AppUser;
import com.travelmaster.user.entity.MembershipTier;
import com.travelmaster.user.entity.UserAuth;
import com.travelmaster.user.repository.AppUserRepository;
import com.travelmaster.user.repository.UserAuthRepository;
import com.travelmaster.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private AppUserRepository appUserRepository;
    @Mock private UserAuthRepository userAuthRepository;
    @Mock private UserService userService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenService jwtTokenService;
    @Mock private StringRedisTemplate redisTemplate;
    @Mock private RateLimitService rateLimitService;
    @Mock private ValueOperations<String, String> valueOps;

    @InjectMocks
    private AuthService authService;

    private static final String TEST_USER_ID = "user-001";
    private static final String TEST_EMAIL = "test@example.com";
    private static final String TEST_PASSWORD = "password123";
    private static final String TEST_NICKNAME = "TestUser";
    private static final String TEST_IP = "127.0.0.1";
    private static final String ACCESS_TOKEN = "access-jwt";
    private static final String REFRESH_TOKEN = "refresh-jwt";

    private UserProfileResponse mockProfile;

    @BeforeEach
    void setUp() {
        mockProfile = new UserProfileResponse(
                TEST_USER_ID, TEST_EMAIL, null, TEST_NICKNAME,
                null, null, MembershipTier.STANDARD, 1, 0, List.of()
        );
    }

    private void setupTokenMocks() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOps);
        lenient().when(jwtTokenService.generateAccessToken(anyString())).thenReturn(ACCESS_TOKEN);
        lenient().when(jwtTokenService.generateRefreshToken(anyString())).thenReturn(REFRESH_TOKEN);
        lenient().when(userService.getCurrentProfile(anyString())).thenReturn(mockProfile);
    }

    // ---- Register Tests ----

    @Test
    @DisplayName("register - success with email")
    void register_success() {
        setupTokenMocks();
        RegisterRequest request = new RegisterRequest(TEST_EMAIL, null, TEST_PASSWORD, TEST_NICKNAME);
        when(appUserRepository.existsByEmail(TEST_EMAIL)).thenReturn(false);
        when(passwordEncoder.encode(TEST_PASSWORD)).thenReturn("hashed");

        AppUser savedUser = new AppUser();
        savedUser.setEmail(TEST_EMAIL);
        when(appUserRepository.save(any(AppUser.class))).thenAnswer(inv -> {
            AppUser user = inv.getArgument(0);
            try {
                var field = user.getClass().getSuperclass().getDeclaredField("id");
                field.setAccessible(true);
                field.set(user, TEST_USER_ID);
            } catch (Exception ignored) {}
            return user;
        });
        when(userAuthRepository.save(any(UserAuth.class))).thenAnswer(inv -> inv.getArgument(0));

        AuthResponse response = authService.register(request, TEST_IP);

        assertNotNull(response);
        assertEquals(ACCESS_TOKEN, response.accessToken());
        assertEquals(REFRESH_TOKEN, response.refreshToken());
        verify(appUserRepository).save(any(AppUser.class));
        verify(userAuthRepository).save(any(UserAuth.class));
        verify(userService).createProfile(anyString(), eq(TEST_NICKNAME));
    }

    @Test
    @DisplayName("register - duplicate email throws CONFLICT")
    void register_duplicateEmail_throwsConflict() {
        RegisterRequest request = new RegisterRequest(TEST_EMAIL, null, TEST_PASSWORD, TEST_NICKNAME);
        when(appUserRepository.existsByEmail(TEST_EMAIL)).thenReturn(true);

        AppException exception = assertThrows(AppException.class,
                () -> authService.register(request, TEST_IP));
        assertEquals(409, exception.getStatus().value());
    }

    @Test
    @DisplayName("register - empty email and phone throws BAD_REQUEST")
    void register_noEmailNoPhone_throwsBadRequest() {
        RegisterRequest request = new RegisterRequest("", null, TEST_PASSWORD, TEST_NICKNAME);

        AppException exception = assertThrows(AppException.class,
                () -> authService.register(request, TEST_IP));
        assertEquals(400, exception.getStatus().value());
    }

    // ---- Login Tests ----

    @Test
    @DisplayName("login - success with email")
    void login_success() {
        setupTokenMocks();
        LoginRequest request = new LoginRequest(TEST_EMAIL, TEST_PASSWORD);

        AppUser user = new AppUser();
        user.setEmail(TEST_EMAIL);
        try {
            var field = user.getClass().getSuperclass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(user, TEST_USER_ID);
        } catch (Exception ignored) {}
        when(appUserRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(user));

        UserAuth auth = new UserAuth();
        auth.setUserId(TEST_USER_ID);
        auth.setPasswordHash("hashed");
        when(userAuthRepository.findByUserId(TEST_USER_ID)).thenReturn(Optional.of(auth));
        when(passwordEncoder.matches(TEST_PASSWORD, "hashed")).thenReturn(true);
        when(userAuthRepository.save(any(UserAuth.class))).thenAnswer(inv -> inv.getArgument(0));

        AuthResponse response = authService.login(request, TEST_IP);

        assertNotNull(response);
        assertEquals(ACCESS_TOKEN, response.accessToken());
        verify(userAuthRepository).save(any(UserAuth.class));
    }

    @Test
    @DisplayName("login - wrong password throws UNAUTHORIZED")
    void login_wrongPassword_throwsUnauthorized() {
        LoginRequest request = new LoginRequest(TEST_EMAIL, "wrongpwd");
        AppUser user = new AppUser();
        user.setEmail(TEST_EMAIL);
        try {
            var field = user.getClass().getSuperclass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(user, TEST_USER_ID);
        } catch (Exception ignored) {}
        when(appUserRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(user));

        UserAuth auth = new UserAuth();
        auth.setPasswordHash("hashed");
        when(userAuthRepository.findByUserId(TEST_USER_ID)).thenReturn(Optional.of(auth));
        when(passwordEncoder.matches("wrongpwd", "hashed")).thenReturn(false);

        AppException exception = assertThrows(AppException.class,
                () -> authService.login(request, TEST_IP));
        assertEquals(401, exception.getStatus().value());
    }

    @Test
    @DisplayName("login - user not found throws UNAUTHORIZED")
    void login_userNotFound_throwsUnauthorized() {
        LoginRequest request = new LoginRequest(TEST_EMAIL, TEST_PASSWORD);
        when(appUserRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class,
                () -> authService.login(request, TEST_IP));
        assertEquals(401, exception.getStatus().value());
    }

    // ---- Refresh Tests ----

    @Test
    @DisplayName("refresh - success")
    void refresh_success() {
        setupTokenMocks();
        RefreshTokenRequest request = new RefreshTokenRequest(REFRESH_TOKEN);
        when(jwtTokenService.isValid(REFRESH_TOKEN, "refresh")).thenReturn(true);
        when(jwtTokenService.getUserId(REFRESH_TOKEN)).thenReturn(TEST_USER_ID);
        when(valueOps.get("auth:refresh:" + TEST_USER_ID)).thenReturn(REFRESH_TOKEN);

        AuthResponse response = authService.refresh(request);

        assertNotNull(response);
        assertEquals(ACCESS_TOKEN, response.accessToken());
    }

    @Test
    @DisplayName("refresh - invalid token throws UNAUTHORIZED")
    void refresh_invalidToken_throwsUnauthorized() {
        RefreshTokenRequest request = new RefreshTokenRequest("bad-token");
        when(jwtTokenService.isValid("bad-token", "refresh")).thenReturn(false);

        AppException exception = assertThrows(AppException.class,
                () -> authService.refresh(request));
        assertEquals(401, exception.getStatus().value());
    }

    @Test
    @DisplayName("refresh - expired refresh token throws UNAUTHORIZED")
    void refresh_expiredRefreshToken_throwsUnauthorized() {
        setupTokenMocks();
        RefreshTokenRequest request = new RefreshTokenRequest(REFRESH_TOKEN);
        when(jwtTokenService.isValid(REFRESH_TOKEN, "refresh")).thenReturn(true);
        when(jwtTokenService.getUserId(REFRESH_TOKEN)).thenReturn(TEST_USER_ID);
        when(valueOps.get("auth:refresh:" + TEST_USER_ID)).thenReturn(null);

        AppException exception = assertThrows(AppException.class,
                () -> authService.refresh(request));
        assertEquals(401, exception.getStatus().value());
    }
}
