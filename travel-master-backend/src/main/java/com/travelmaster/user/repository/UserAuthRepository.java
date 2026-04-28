package com.travelmaster.user.repository;

import com.travelmaster.user.entity.UserAuth;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserAuthRepository extends JpaRepository<UserAuth, String> {
    Optional<UserAuth> findByUserId(String userId);
}
