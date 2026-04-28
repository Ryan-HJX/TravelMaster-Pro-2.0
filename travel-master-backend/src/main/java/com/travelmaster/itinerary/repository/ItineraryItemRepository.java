package com.travelmaster.itinerary.repository;

import com.travelmaster.itinerary.entity.ItineraryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItineraryItemRepository extends JpaRepository<ItineraryItem, String> {
    List<ItineraryItem> findByItineraryIdOrderByDayNumberAscSequenceNumberAsc(String itineraryId);
}
