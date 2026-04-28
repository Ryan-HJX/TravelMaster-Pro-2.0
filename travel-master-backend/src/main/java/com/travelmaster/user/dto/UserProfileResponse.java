package com.travelmaster.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.travelmaster.user.entity.MembershipTier;
import java.util.List;

public class UserProfileResponse {
    private String userId;
    private String email;
    private String phone;
    private String nickname;
    private String avatarUrl;
    private String bio;
    private MembershipTier membershipTier;
    private Integer level;
    private Integer points;
    private List<String> preferenceTags;

    public UserProfileResponse() {
    }

    public UserProfileResponse(String userId, String email, String phone, String nickname, String avatarUrl, String bio, MembershipTier membershipTier, Integer level, Integer points, List<String> preferenceTags) {
        this.userId = userId;
        this.email = email;
        this.phone = phone;
        this.nickname = nickname;
        this.avatarUrl = avatarUrl;
        this.bio = bio;
        this.membershipTier = membershipTier;
        this.level = level;
        this.points = points;
        this.preferenceTags = preferenceTags;
    }

    @JsonProperty("userId")
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    @JsonProperty("email")
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    @JsonProperty("phone")
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    @JsonProperty("nickname")
    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }

    @JsonProperty("avatarUrl")
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    @JsonProperty("bio")
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    @JsonProperty("membershipTier")
    public MembershipTier getMembershipTier() { return membershipTier; }
    public void setMembershipTier(MembershipTier membershipTier) { this.membershipTier = membershipTier; }

    @JsonProperty("level")
    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }

    @JsonProperty("points")
    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }

    @JsonProperty("preferenceTags")
    public List<String> getPreferenceTags() { return preferenceTags; }
    public void setPreferenceTags(List<String> preferenceTags) { this.preferenceTags = preferenceTags; }

    // --- Record-style Compatibility Methods ---
    public String userId() { return userId; }
    public String email() { return email; }
    public String phone() { return phone; }
    public String nickname() { return nickname; }
    public String avatarUrl() { return avatarUrl; }
    public String bio() { return bio; }
    public MembershipTier membershipTier() { return membershipTier; }
    public Integer level() { return level; }
    public Integer points() { return points; }
    public List<String> preferenceTags() { return preferenceTags; }
}
