package com.travelmaster.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmaster.auth.controller.AuthController;
import com.travelmaster.auth.dto.AuthResponse;
import com.travelmaster.auth.dto.LoginRequest;
import com.travelmaster.auth.dto.RefreshTokenRequest;
import com.travelmaster.auth.dto.RegisterRequest;
import com.travelmaster.auth.service.AuthService;
import com.travelmaster.common.dto.ApiResponse;
import com.travelmaster.user.dto.UserProfileResponse;
import com.travelmaster.user.entity.MembershipTier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Controller-layer test for AuthController.
 * Uses standalone MockMvc setup to avoid Spring context loading.
 * AuthService is mocked to isolate controller behavior.
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerIntegrationTest {

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    private static final UserProfileResponse MOCK_USER = new UserProfileResponse(
            "user-001", "test@example.com", null, "TestUser", null, null,
            MembershipTier.STANDARD, 1, 0, List.of()
    );

    private static final AuthResponse MOCK_AUTH = new AuthResponse(
            "access-jwt", "refresh-jwt", 7200, MOCK_USER
    );

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
        objectMapper = new ObjectMapper();
    }

    // ---- Register ----

    @Test
    @DisplayName("POST /api/auth/register - success returns 200 with tokens")
    void register_success() throws Exception {
        when(authService.register(any(RegisterRequest.class), anyString())).thenReturn(MOCK_AUTH);

        String body = """
                {
                    "email": "test@example.com",
                    "password": "password123",
                    "nickname": "TestUser"
                }
                """;

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.accessToken").value("access-jwt"))
                .andExpect(jsonPath("$.data.refreshToken").value("refresh-jwt"))
                .andExpect(jsonPath("$.data.user.nickname").value("TestUser"));
    }

    // ---- Login ----

    @Test
    @DisplayName("POST /api/auth/login - success returns 200 with tokens")
    void login_success() throws Exception {
        when(authService.login(any(LoginRequest.class), anyString())).thenReturn(MOCK_AUTH);

        String body = """
                {
                    "account": "test@example.com",
                    "password": "password123"
                }
                """;

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").value("access-jwt"))
                .andExpect(jsonPath("$.data.user.email").value("test@example.com"));
    }

    // ---- Refresh ----

    @Test
    @DisplayName("POST /api/auth/refresh - success returns new tokens")
    void refresh_success() throws Exception {
        when(authService.refresh(any(RefreshTokenRequest.class))).thenReturn(MOCK_AUTH);

        String body = """
                {
                    "refreshToken": "old-refresh-token"
                }
                """;

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").value("access-jwt"))
                .andExpect(jsonPath("$.data.refreshToken").value("refresh-jwt"));
    }

    // ---- Edge Cases ----

    @Test
    @DisplayName("POST /api/auth/register - empty body returns 400")
    void register_emptyBody_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/login - empty body returns 400")
    void login_emptyBody_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
