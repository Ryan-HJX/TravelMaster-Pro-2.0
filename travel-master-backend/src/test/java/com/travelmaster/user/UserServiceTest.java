package com.travelmaster.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmaster.common.exception.AppException;
import com.travelmaster.user.dto.UpdateUserProfileRequest;
import com.travelmaster.user.dto.UserProfileResponse;
import com.travelmaster.user.entity.AppUser;
import com.travelmaster.user.entity.MembershipTier;
import com.travelmaster.user.entity.UserProfile;
import com.travelmaster.user.entity.UserStatus;
import com.travelmaster.user.repository.AppUserRepository;
import com.travelmaster.user.repository.UserProfileRepository;
import com.travelmaster.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private UserService userService;

    private static final String TEST_USER_ID = "user-001";
    private static final String TEST_EMAIL = "test@example.com";
    private static final String TEST_NICKNAME = "TestUser";

    private AppUser testUser;
    private UserProfile testProfile;

    @BeforeEach
    void setUp() {
        testUser = new AppUser();
        try {
            var field = testUser.getClass().getSuperclass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(testUser, TEST_USER_ID);
        } catch (Exception ignored) {}
        testUser.setEmail(TEST_EMAIL);
        testUser.setStatus(UserStatus.ACTIVE);
        testUser.setMembershipTier(MembershipTier.STANDARD);
        testUser.setLevel(1);
        testUser.setPoints(0);

        testProfile = new UserProfile();
        testProfile.setUserId(TEST_USER_ID);
        testProfile.setNickname(TEST_NICKNAME);
    }

    @Test
    @DisplayName("getCurrentProfile - success returns profile")
    void getCurrentProfile_success() {
        when(appUserRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));
        when(userProfileRepository.findByUserId(TEST_USER_ID)).thenReturn(Optional.of(testProfile));

        UserProfileResponse response = userService.getCurrentProfile(TEST_USER_ID);

        assertNotNull(response);
        assertEquals(TEST_USER_ID, response.userId());
        assertEquals(TEST_EMAIL, response.email());
        assertEquals(TEST_NICKNAME, response.nickname());
    }

    @Test
    @DisplayName("getCurrentProfile - user not found throws NOT_FOUND")
    void getCurrentProfile_userNotFound_throwsNotFound() {
        when(appUserRepository.findById(TEST_USER_ID)).thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class,
                () -> userService.getCurrentProfile(TEST_USER_ID));
        assertEquals(404, exception.getStatus().value());
    }

    @Test
    @DisplayName("getCurrentProfile - profile not found throws NOT_FOUND")
    void getCurrentProfile_profileNotFound_throwsNotFound() {
        when(appUserRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));
        when(userProfileRepository.findByUserId(TEST_USER_ID)).thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class,
                () -> userService.getCurrentProfile(TEST_USER_ID));
        assertEquals(404, exception.getStatus().value());
    }

    @Test
    @DisplayName("getProfileSafe - returns default profile when user not found")
    void getProfileSafe_userNotFound_returnsDefault() {
        when(appUserRepository.findById(TEST_USER_ID)).thenReturn(Optional.empty());

        UserProfileResponse response = userService.getProfileSafe(TEST_USER_ID);

        assertNotNull(response);
        assertEquals(TEST_USER_ID, response.userId());
        assertEquals("已注销用户", response.nickname());
    }

    @Test
    @DisplayName("updateProfile - success updates profile")
    void updateProfile_success() throws Exception {
        UpdateUserProfileRequest request = new UpdateUserProfileRequest("NewNickname", "New bio", "http://avatar.com", null, List.of("tag1", "tag2"));
        when(appUserRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));
        when(userProfileRepository.findByUserId(TEST_USER_ID)).thenReturn(Optional.of(testProfile));
        when(objectMapper.writeValueAsString(anyList())).thenReturn("[\"tag1\",\"tag2\"]");
        when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(inv -> inv.getArgument(0));

        UserProfileResponse response = userService.updateProfile(TEST_USER_ID, request);

        assertNotNull(response);
        assertEquals("NewNickname", response.nickname());
        verify(userProfileRepository).save(any(UserProfile.class));
    }

    @Test
    @DisplayName("updateProfile - with phone updates user")
    void updateProfile_withPhone_updatesUser() throws Exception {
        UpdateUserProfileRequest request = new UpdateUserProfileRequest("NewNickname", null, null, "13800138000", null);
        when(appUserRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));
        when(userProfileRepository.findByUserId(TEST_USER_ID)).thenReturn(Optional.of(testProfile));
        when(objectMapper.writeValueAsString(anyList())).thenReturn("[]");
        when(userProfileRepository.save(any(UserProfile.class))).thenAnswer(inv -> inv.getArgument(0));
        when(appUserRepository.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        UserProfileResponse response = userService.updateProfile(TEST_USER_ID, request);

        assertNotNull(response);
        verify(appUserRepository).save(any(AppUser.class));
    }

    @Test
    @DisplayName("batchProfiles - empty list returns empty map")
    void batchProfiles_emptyList_returnsEmptyMap() {
        Map<String, UserProfileResponse> result = userService.batchProfiles(Collections.emptyList());

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("createProfile - success creates profile")
    void createProfile_success() {
        UserProfile savedProfile = new UserProfile();
        savedProfile.setUserId(TEST_USER_ID);
        savedProfile.setNickname(TEST_NICKNAME);
        
        when(userProfileRepository.save(any(UserProfile.class))).thenReturn(savedProfile);

        UserProfile result = userService.createProfile(TEST_USER_ID, TEST_NICKNAME);

        assertNotNull(result);
        assertEquals(TEST_USER_ID, result.getUserId());
        assertEquals(TEST_NICKNAME, result.getNickname());
    }

    @Test
    @DisplayName("toResponse - null user returns null")
    void toResponse_nullUser_returnsNull() {
        UserProfileResponse response = userService.toResponse(null, testProfile);
        assertNull(response);
    }

    @Test
    @DisplayName("toResponse - null profile uses default values")
    void toResponse_nullProfile_usesDefaults() {
        UserProfileResponse response = userService.toResponse(testUser, null);

        assertNotNull(response);
        assertEquals("旅行者", response.nickname());
        assertNull(response.avatarUrl());
    }
}