package com.travelmaster.itinerary;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travelmaster.itinerary.controller.ItineraryTaskController;
import com.travelmaster.itinerary.dto.CreateTaskRequest;
import com.travelmaster.itinerary.dto.TaskResponse;
import com.travelmaster.itinerary.entity.TaskStatus;
import com.travelmaster.itinerary.service.ItineraryTaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ItineraryControllerTest {

    @Mock
    private ItineraryTaskService itineraryTaskService;

    @InjectMocks
    private ItineraryTaskController itineraryTaskController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    private static final TaskResponse MOCK_TASK = new TaskResponse(
            "task-001",
            "trace-001",
            "v1-pro",
            "test input",
            TaskStatus.PROCESSING,
            null,
            LocalDateTime.now(),
            LocalDateTime.now(),
            null,
            null
    );

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(itineraryTaskController).build();
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
    }

    @Test
    @DisplayName("POST /api/itinerary-tasks - success creates task")
    void createTask_success() throws Exception {
        when(itineraryTaskService.createTask(anyString(), any(CreateTaskRequest.class), anyString(), anyString())).thenReturn(MOCK_TASK);

        String body = """
                {
                    "originCity": "北京",
                    "destinationCity": "上海",
                    "travelDate": "2024-07-15",
                    "durationDays": 3,
                    "budgetLevel": "MEDIUM",
                    "interests": ["food", "sightseeing"]
                }
                """;

        mockMvc.perform(post("/api/itinerary-tasks")
                        .header("X-User-Id", "user-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.code").value(202))
                .andExpect(jsonPath("$.data.taskId").value("task-001"))
                .andExpect(jsonPath("$.data.status").value("PROCESSING"));
    }

    @Test
    @DisplayName("GET /api/itinerary-tasks/{taskId} - success returns task")
    void getTask_success() throws Exception {
        when(itineraryTaskService.getTask(anyString(), anyString())).thenReturn(MOCK_TASK);

        mockMvc.perform(get("/api/itinerary-tasks/task-001")
                        .header("X-User-Id", "user-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.taskId").value("task-001"));
    }

    @Test
    @DisplayName("POST /api/itinerary-tasks - missing city returns 400")
    void createTask_missingCity_returns400() throws Exception {
        String body = """
                {
                    "travelDate": "2024-07-15",
                    "durationDays": 3
                }
                """;

        mockMvc.perform(post("/api/itinerary-tasks")
                        .header("X-User-Id", "user-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }
}