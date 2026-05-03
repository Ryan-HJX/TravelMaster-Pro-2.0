package com.travelmaster.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmaster.security.AuthenticatedUser;
import com.travelmaster.user.controller.UserController;
import com.travelmaster.user.dto.UpdateUserProfileRequest;
import com.travelmaster.user.dto.UserProfileResponse;
import com.travelmaster.user.entity.MembershipTier;
import com.travelmaster.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    private static final UserProfileResponse MOCK_PROFILE = new UserProfileResponse(
            "user-001", "test@example.com", "13800138000", "TestUser",
            "http://avatar.com", "bio", MembershipTier.STANDARD, 1, 0, List.of()
    );

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController).build();
        objectMapper = new ObjectMapper();
        
        // Setup security context with a mock authenticated user
        AuthenticatedUser mockUser = new AuthenticatedUser("user-001");
        UsernamePasswordAuthenticationToken authentication = 
            new UsernamePasswordAuthenticationToken(mockUser, null, List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    @DisplayName("GET /api/users/me - success returns profile")
    void getProfile_success() throws Exception {
        when(userService.getCurrentProfile(anyString())).thenReturn(MOCK_PROFILE);

        mockMvc.perform(get("/api/users/me")
                        .header("X-User-Id", "user-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.nickname").value("TestUser"))
                .andExpect(jsonPath("$.data.email").value("test@example.com"));
    }

    @Test
    @DisplayName("PUT /api/users/me - success updates profile")
    void updateProfile_success() throws Exception {
        when(userService.updateProfile(anyString(), any(UpdateUserProfileRequest.class))).thenReturn(MOCK_PROFILE);

        String body = """
                {
                    "nickname": "NewNickname",
                    "bio": "New bio",
                    "avatarUrl": "http://new-avatar.com",
                    "preferenceTags": ["travel", "food"]
                }
                """;

        mockMvc.perform(put("/api/users/me")
                        .header("X-User-Id", "user-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.nickname").value("TestUser"));
    }

    @Test
    @DisplayName("PUT /api/users/me - empty body returns 400")
    void updateProfile_emptyBody_returns400() throws Exception {
        mockMvc.perform(put("/api/users/me")
                        .header("X-User-Id", "user-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
}