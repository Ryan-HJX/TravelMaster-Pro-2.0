package com.travelmaster.dto;

import lombok.Data;

/**
 * 发送给 Python Agent 服务的请求 DTO。
 */
@Data
public class PlanRequest {
    private String query;
    private String userId;

    public PlanRequest() {}

    public PlanRequest(String query, String userId) {
        this.query = query;
        this.userId = userId;
    }
}
