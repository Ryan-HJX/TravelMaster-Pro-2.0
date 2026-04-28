package com.travelmaster.social.repository;

import com.travelmaster.social.entity.Follow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, String> {
    boolean existsByFollowerIdAndFolloweeId(String followerId, String followeeId);
    Optional<Follow> findByFollowerIdAndFolloweeId(String followerId, String followeeId);
    List<Follow> findByFolloweeId(String followeeId);
}
