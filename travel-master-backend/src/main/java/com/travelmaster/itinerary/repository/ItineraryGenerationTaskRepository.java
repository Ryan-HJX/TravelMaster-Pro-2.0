package com.travelmaster.itinerary.repository;

import com.travelmaster.itinerary.entity.ItineraryGenerationTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ItineraryGenerationTaskRepository extends JpaRepository<ItineraryGenerationTask, String> {
    Optional<ItineraryGenerationTask> findByIdAndUserId(String id, String userId);
    Optional<ItineraryGenerationTask> findByUserIdAndIdempotencyKey(String userId, String idempotencyKey);
    List<ItineraryGenerationTask> findByUserIdOrderByCreatedAtDesc(String userId);
}
