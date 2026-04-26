package com.travelmaster.repository;

import com.travelmaster.entity.Itinerary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * 行程单数据访问接口 (Repository)。
 */
@Repository
public interface ItineraryRepository extends JpaRepository<Itinerary, Long> {
    
    /**
     * 根据用户 ID 查询历史行程，按创建时间倒序排列。
     */
    List<Itinerary> findByUserIdOrderByCreatedAtDesc(String userId);
}
