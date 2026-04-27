package com.travelmaster.dto;

import lombok.Data;

/**
 * 接收 Python Agent 服务响应的 DTO。
 */
@Data
public class PlanResponse {
    private int code;
    private DataContent data;
    private String message;

    @Data
    public static class DataContent {
        private String itinerary;
        private java.util.List<Object> waypoints;
    }
}
