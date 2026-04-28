package com.travelmaster.user.repository;

import com.travelmaster.user.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, String> {
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    Optional<AppUser> findByEmail(String email);
    Optional<AppUser> findByPhone(String phone);
}
