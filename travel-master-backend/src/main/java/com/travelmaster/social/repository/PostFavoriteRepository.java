package com.travelmaster.social.repository;

import com.travelmaster.social.entity.PostFavorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostFavoriteRepository extends JpaRepository<PostFavorite, String> {
    boolean existsByPostIdAndUserId(String postId, String userId);
    Optional<PostFavorite> findByPostIdAndUserId(String postId, String userId);
}
