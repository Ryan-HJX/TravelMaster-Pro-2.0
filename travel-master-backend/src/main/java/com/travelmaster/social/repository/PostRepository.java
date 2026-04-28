package com.travelmaster.social.repository;

import com.travelmaster.social.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, String> {
    Page<Post> findAllByOrderByPublishedAtDesc(Pageable pageable);
    Optional<Post> findByItineraryId(String itineraryId);
    List<Post> findTop10ByOrderByLikeCountDescPublishedAtDesc();
}
