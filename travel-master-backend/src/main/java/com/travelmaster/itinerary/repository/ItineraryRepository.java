package com.travelmaster.itinerary.repository;

import com.travelmaster.itinerary.entity.Itinerary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ItineraryRepository extends JpaRepository<Itinerary, String> {
    Optional<Itinerary> findByIdAndUserId(String id, String userId);
    Optional<Itinerary> findByTaskId(String taskId);
    List<Itinerary> findByUserIdOrderByCreatedAtDesc(String userId);
}
