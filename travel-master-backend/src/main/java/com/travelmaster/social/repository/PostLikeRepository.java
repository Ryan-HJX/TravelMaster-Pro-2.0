package com.travelmaster.social.repository;

import com.travelmaster.social.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, String> {
    boolean existsByPostIdAndUserId(String postId, String userId);
    Optional<PostLike> findByPostIdAndUserId(String postId, String userId);
    List<PostLike> findByPostId(String postId);
    void deleteByPostId(String postId);
}
