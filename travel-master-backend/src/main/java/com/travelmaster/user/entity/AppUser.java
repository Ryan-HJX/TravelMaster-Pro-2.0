package com.travelmaster.user.entity;

import com.travelmaster.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "users")
public class AppUser extends BaseEntity {

    @Column(unique = true)
    private String email;

    @Column(unique = true)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "membership_tier", nullable = false, length = 20)
    private MembershipTier membershipTier = MembershipTier.STANDARD;

    @Column(nullable = false)
    private Integer level = 1;

    @Column(nullable = false)
    private Integer points = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status = UserStatus.ACTIVE;
}
