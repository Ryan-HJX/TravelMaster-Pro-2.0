package com.travelmaster.dto;

import lombok.Data;

/**
 * 接收 Python Agent 服务响应的 DTO。
 */
@Data
public class PlanResponse {
    private String itinerary;
    private String status;
    private java.util.List<Object> waypoints;
}
