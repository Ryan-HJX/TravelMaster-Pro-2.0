package com.travelmaster.service;

import com.travelmaster.dto.PlanRequest;
import com.travelmaster.dto.PlanResponse;
import com.travelmaster.entity.Itinerary;
import com.travelmaster.repository.ItineraryRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import java.util.List;

/**
 * 行程规划服务：负责与 Python Agent 核心服务进行通信。
 */
@Service
public class ItineraryService {

    private final WebClient webClient;
    private final ItineraryRepository itineraryRepository;

    /**
     * 构造函数注入 WebClient 和 Repository。
     */
    public ItineraryService(
            @Value("${python.agent.url:http://localhost:8000}") String pythonAgentUrl,
            ItineraryRepository itineraryRepository) {
        this.webClient = WebClient.builder().baseUrl(pythonAgentUrl).build();
        this.itineraryRepository = itineraryRepository;
    }

    /**
     * 调用 Python Agent 生成旅游行程，并持久化到数据库。
     */
    public Mono<PlanResponse> generateItinerary(PlanRequest request) {
        return webClient.post()
                .uri("/api/v1/plan")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(PlanResponse.class)
                .doOnSuccess(response -> {
                    // 当成功获取到行程单后，存入数据库
                    if (response != null && response.getData() != null && response.getData().getItinerary() != null) {
                        Itinerary itinerary = new Itinerary();
                        itinerary.setUserId(request.getUserId());
                        itinerary.setContent(response.getData().getItinerary());
                        
                        try {
                            if (response.getData().getWaypoints() != null) {
                                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                                itinerary.setWaypoints(mapper.writeValueAsString(response.getData().getWaypoints()));
                            }
                        } catch (Exception e) {
                            System.err.println("❌ 途经点 JSON 序列化失败: " + e.getMessage());
                        }

                        itineraryRepository.save(itinerary);
                        System.out.println("✅ 行程单已存入数据库 (ID: " + itinerary.getId() + ")");
                    }
                });
    }

    /**
     * 查询用户的历史行程。
     */
    public List<Itinerary> getHistory(String userId) {
        return itineraryRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * 删除指定的行程。
     */
    public void deleteItinerary(Long id) {
        itineraryRepository.deleteById(id);
        System.out.println("✅ 行程单已删除 (ID: " + id + ")");
    }
}
