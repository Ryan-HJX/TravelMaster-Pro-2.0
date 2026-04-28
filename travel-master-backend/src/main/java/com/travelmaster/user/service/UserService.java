package com.travelmaster.user.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmaster.common.exception.AppException;
import com.travelmaster.user.dto.UpdateUserProfileRequest;
import com.travelmaster.user.dto.UserProfileResponse;
import com.travelmaster.user.entity.AppUser;
import com.travelmaster.user.entity.UserProfile;
import com.travelmaster.user.entity.UserStatus;
import com.travelmaster.user.repository.AppUserRepository;
import com.travelmaster.user.repository.UserProfileRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class UserService {
    private final AppUserRepository appUserRepository;
    private final UserProfileRepository userProfileRepository;
    private final ObjectMapper objectMapper;

    public UserService(AppUserRepository appUserRepository,
                       UserProfileRepository userProfileRepository,
                       ObjectMapper objectMapper) {
        this.appUserRepository = appUserRepository;
        this.userProfileRepository = userProfileRepository;
        this.objectMapper = objectMapper;
    }

    public UserProfileResponse getCurrentProfile(String userId) {
        AppUser user = appUserRepository.findById(userId)
                .filter(found -> found.getStatus() == UserStatus.ACTIVE)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "user not found"));
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "profile not found"));
        return toResponse(user, profile);
    }

    public UserProfileResponse getProfileSafe(String userId) {
        try {
            return getCurrentProfile(userId);
        } catch (Exception e) {
            return new UserProfileResponse(userId, null, null, "已注销用户", null, null,
                    com.travelmaster.user.entity.MembershipTier.STANDARD, 1, 0, List.of());
        }
    }

    public UserProfileResponse updateProfile(String userId, UpdateUserProfileRequest request) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "user not found"));
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "profile not found"));

        profile.setNickname(request.nickname());
        profile.setBio(request.bio());
        profile.setAvatarUrl(request.avatarUrl());
        profile.setPreferenceTags(toJson(request.preferenceTags()));

        if (request.phone() != null && !request.phone().isBlank()) {
            user.setPhone(request.phone());
            appUserRepository.save(user);
        }

        userProfileRepository.save(profile);
        return toResponse(user, profile);
    }

    public Map<String, UserProfileResponse> batchProfiles(List<String> userIds) {
        if (userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<String, AppUser> users = appUserRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(AppUser::getId, Function.identity()));
        return userProfileRepository.findByUserIdIn(userIds).stream()
                .filter(profile -> users.containsKey(profile.getUserId()))
                .map(profile -> toResponse(users.get(profile.getUserId()), profile))
                .collect(Collectors.toMap(UserProfileResponse::userId, Function.identity()));
    }

    public UserProfile createProfile(String userId, String nickname) {
        UserProfile profile = new UserProfile();
        profile.setUserId(userId);
        profile.setNickname(nickname);
        profile.setPreferenceTags("[]");
        return userProfileRepository.save(profile);
    }

    public UserProfileResponse toResponse(AppUser user, UserProfile profile) {
        if (user == null) return null;
        String nickname = (profile != null && profile.getNickname() != null) ? profile.getNickname() : "旅行者";
        String avatar = (profile != null) ? profile.getAvatarUrl() : null;
        String bio = (profile != null) ? profile.getBio() : null;
        String tagsJson = (profile != null) ? profile.getPreferenceTags() : "[]";

        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getPhone(),
                nickname,
                avatar,
                bio,
                user.getMembershipTier() != null ? user.getMembershipTier() : com.travelmaster.user.entity.MembershipTier.STANDARD,
                user.getLevel() != null ? user.getLevel() : 1,
                user.getPoints() != null ? user.getPoints() : 0,
                fromJson(tagsJson)
        );
    }

    private String toJson(List<String> value) {
        try {
            return objectMapper.writeValueAsString(value == null ? List.of() : value);
        } catch (JsonProcessingException exception) {
            throw new AppException(HttpStatus.INTERNAL_SERVER_ERROR, "failed to store profile tags");
        }
    }

    private List<String> fromJson(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(value, new TypeReference<>() {
            });
        } catch (JsonProcessingException exception) {
            return List.of();
        }
    }
}
