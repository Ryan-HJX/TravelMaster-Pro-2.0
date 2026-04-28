-- V3: Add inter-city transportation fields to itineraries table
-- 添加大交通相关字段

ALTER TABLE itineraries
    ADD COLUMN departure_city VARCHAR(100) COMMENT '出发城市' AFTER user_id,
    ADD COLUMN start_date DATE COMMENT '开始日期' AFTER departure_city,
    ADD COLUMN end_date DATE COMMENT '结束日期' AFTER start_date,
    ADD COLUMN transport_summary JSON COMMENT '大交通方案JSON（包含往返航班/火车信息）' AFTER finance_summary;

-- Add index for faster queries by departure city
CREATE INDEX idx_itineraries_departure_city ON itineraries(departure_city);
