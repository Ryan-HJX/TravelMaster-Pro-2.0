package com.travelmaster.itinerary.repository;

import com.travelmaster.itinerary.entity.ItineraryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ItineraryItemRepository extends JpaRepository<ItineraryItem, String> {
    List<ItineraryItem> findByItineraryIdOrderByDayNumberAscSequenceNumberAsc(String itineraryId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM ItineraryItem i WHERE i.itineraryId = :itineraryId")
    void deleteByItineraryId(@Param("itineraryId") String itineraryId);
}
