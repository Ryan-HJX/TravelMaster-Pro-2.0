CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    email VARCHAR(255) NULL UNIQUE,
    phone VARCHAR(50) NULL UNIQUE,
    membership_tier VARCHAR(20) NOT NULL,
    level INT NOT NULL,
    points INT NOT NULL,
    status VARCHAR(20) NOT NULL
);

CREATE TABLE user_profile (
    id VARCHAR(36) PRIMARY KEY,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    nickname VARCHAR(64) NOT NULL,
    avatar_url VARCHAR(255) NULL,
    bio TEXT NULL,
    preference_tags TEXT NULL,
    CONSTRAINT fk_user_profile_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE user_auth (
    id VARCHAR(36) PRIMARY KEY,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    provider VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    last_login_at DATETIME(6) NULL,
    CONSTRAINT fk_user_auth_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE itinerary_generation_task (
    id VARCHAR(36) PRIMARY KEY,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    user_input TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    prompt_version VARCHAR(50) NOT NULL,
    trace_id VARCHAR(64) NOT NULL,
    request_payload LONGTEXT NOT NULL,
    result_payload LONGTEXT NULL,
    failure_reason TEXT NULL,
    idempotency_key VARCHAR(100) NOT NULL,
    itinerary_id VARCHAR(36) NULL,
    completed_at DATETIME(6) NULL,
    CONSTRAINT fk_task_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE itineraries (
    id VARCHAR(36) PRIMARY KEY,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    task_id VARCHAR(36) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    summary TEXT NULL,
    risk_tips TEXT NULL,
    rendered_markdown LONGTEXT NULL,
    structured_content LONGTEXT NULL,
    published_at DATETIME(6) NULL,
    CONSTRAINT fk_itinerary_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_itinerary_task FOREIGN KEY (task_id) REFERENCES itinerary_generation_task(id)
);

CREATE TABLE itinerary_items (
    id VARCHAR(36) PRIMARY KEY,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    itinerary_id VARCHAR(36) NOT NULL,
    day_number INT NOT NULL,
    sequence_number INT NOT NULL,
    item_title VARCHAR(200) NOT NULL,
    activity_type VARCHAR(50) NULL,
    address VARCHAR(255) NULL,
    start_time VARCHAR(20) NULL,
    end_time VARCHAR(20) NULL,
    transport_mode VARCHAR(50) NULL,
    transport_duration_minutes INT NULL,
    notes TEXT NULL,
    CONSTRAINT fk_itinerary_item_parent FOREIGN KEY (itinerary_id) REFERENCES itineraries(id)
);

CREATE TABLE posts (
    id VARCHAR(36) PRIMARY KEY,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    itinerary_id VARCHAR(36) NOT NULL UNIQUE,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content_excerpt TEXT NULL,
    like_count INT NOT NULL DEFAULT 0,
    favorite_count INT NOT NULL DEFAULT 0,
    comment_count INT NOT NULL DEFAULT 0,
    published_at DATETIME(6) NOT NULL,
    CONSTRAINT fk_post_itinerary FOREIGN KEY (itinerary_id) REFERENCES itineraries(id),
    CONSTRAINT fk_post_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE post_likes (
    id VARCHAR(36) PRIMARY KEY,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    post_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    CONSTRAINT fk_post_like_post FOREIGN KEY (post_id) REFERENCES posts(id),
    CONSTRAINT fk_post_like_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uk_post_like UNIQUE (post_id, user_id)
);

CREATE TABLE post_favorites (
    id VARCHAR(36) PRIMARY KEY,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    post_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    CONSTRAINT fk_post_favorite_post FOREIGN KEY (post_id) REFERENCES posts(id),
    CONSTRAINT fk_post_favorite_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT uk_post_favorite UNIQUE (post_id, user_id)
);

CREATE TABLE comments (
    id VARCHAR(36) PRIMARY KEY,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    post_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    parent_id VARCHAR(36) NULL,
    content TEXT NOT NULL,
    CONSTRAINT fk_comment_post FOREIGN KEY (post_id) REFERENCES posts(id),
    CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE follows (
    id VARCHAR(36) PRIMARY KEY,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    follower_id VARCHAR(36) NOT NULL,
    followee_id VARCHAR(36) NOT NULL,
    CONSTRAINT fk_follow_follower FOREIGN KEY (follower_id) REFERENCES users(id),
    CONSTRAINT fk_follow_followee FOREIGN KEY (followee_id) REFERENCES users(id),
    CONSTRAINT uk_follow UNIQUE (follower_id, followee_id)
);

CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    actor_id VARCHAR(36) NULL,
    type VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    related_resource_type VARCHAR(50) NULL,
    related_resource_id VARCHAR(36) NULL,
    read_status BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE user_behavior_events (
    id VARCHAR(36) PRIMARY KEY,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    user_id VARCHAR(36) NULL,
    event_type VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NULL,
    resource_id VARCHAR(36) NULL,
    payload TEXT NULL
);

CREATE INDEX idx_task_status_created ON itinerary_generation_task(status, created_at);
CREATE INDEX idx_task_user_created ON itinerary_generation_task(user_id, created_at);
CREATE INDEX idx_itinerary_user_created ON itineraries(user_id, created_at);
CREATE INDEX idx_post_published ON posts(published_at);
CREATE INDEX idx_comment_post_created ON comments(post_id, created_at);
CREATE INDEX idx_notification_user_read_created ON notifications(user_id, read_status, created_at);
CREATE INDEX idx_event_type_created ON user_behavior_events(event_type, created_at);
