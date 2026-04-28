-- V2: MCP-enhanced schema additions for TravelMaster Pro 2.0
-- Adds model tracing, MCP tool call logging, planning score, and geo/weather/finance fields.

-- itinerary_generation_task: model + MCP observability
ALTER TABLE itinerary_generation_task
    ADD COLUMN model_provider VARCHAR(30) NULL AFTER prompt_version,
    ADD COLUMN model_name VARCHAR(60) NULL AFTER model_provider,
    ADD COLUMN mcp_trace LONGTEXT NULL AFTER result_payload,
    ADD COLUMN tool_calls LONGTEXT NULL AFTER mcp_trace,
    ADD COLUMN fallback_used BOOLEAN NOT NULL DEFAULT FALSE AFTER tool_calls,
    ADD COLUMN planning_score VARCHAR(20) NULL AFTER fallback_used;

-- itineraries: real geo data + weather + finance
ALTER TABLE itineraries
    ADD COLUMN start_location VARCHAR(200) NULL AFTER title,
    ADD COLUMN end_location VARCHAR(200) NULL AFTER start_location,
    ADD COLUMN travel_mode_preference VARCHAR(30) NULL AFTER end_location,
    ADD COLUMN weather_summary TEXT NULL AFTER travel_mode_preference,
    ADD COLUMN finance_summary TEXT NULL AFTER weather_summary,
    ADD COLUMN planning_score VARCHAR(20) NULL AFTER finance_summary;

-- Index for analytics: model provider distribution
CREATE INDEX idx_task_model_provider ON itinerary_generation_task (model_provider);
CREATE INDEX idx_task_planning_score ON itinerary_generation_task (planning_score);
