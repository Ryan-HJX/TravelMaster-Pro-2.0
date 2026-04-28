package com.travelmaster.analytics.service;

import com.travelmaster.analytics.entity.UserBehaviorEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BehaviorEventRepository extends JpaRepository<UserBehaviorEvent, String> {
}
