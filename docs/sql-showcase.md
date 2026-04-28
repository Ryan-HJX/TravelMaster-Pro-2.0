# TravelMaster Pro — 核心 SQL 清单与索引分析

本文档列出项目中最有代表性的 SQL 查询，附带索引设计说明和 EXPLAIN 分析。

---

## 1. Feed 时间线分页查询

```sql
-- 场景：获取社交 Feed，按发布时间倒序分页
SELECT p.id, p.title, p.content_excerpt, p.like_count, p.favorite_count,
       p.comment_count, p.published_at, p.user_id,
       up.nickname, up.avatar_url
FROM posts p
JOIN user_profile up ON up.user_id = p.user_id
WHERE p.published_at < ?          -- cursor-based 分页
ORDER BY p.published_at DESC
LIMIT 20;
```

**索引**：`idx_post_published ON posts(published_at)`

**EXPLAIN 分析**：
- `type: range` — 利用 `published_at` 索引做范围扫描
- `key: idx_post_published` — 走覆盖索引
- `rows: ~20` — LIMIT 限制扫描行数
- 为什么不用 `OFFSET`：随着页数增加 `OFFSET` 会扫描越来越多行，cursor-based 分页保持恒定性能

---

## 2. 热门行程排行榜

```sql
-- 场景：按点赞数排序的热门行程 Top 20
-- 实际生产中优先走 Redis ZREVRANGE，数据库作为降级和回刷源
SELECT p.id, p.title, p.like_count, p.favorite_count, p.comment_count,
       p.published_at, up.nickname
FROM posts p
JOIN user_profile up ON up.user_id = p.user_id
ORDER BY p.like_count DESC, p.published_at DESC
LIMIT 20;
```

**索引建议**：可增加 `(like_count DESC, published_at DESC)` 联合索引，但由于榜单数据量不大且走 Redis 热路径，MySQL 全表扫描 + filesort 在当前规模下可接受。

**EXPLAIN 分析**：
- `type: ALL` — 全表扫描（表小时性能无影响）
- `Extra: Using filesort` — ORDER BY 走内存排序
- 优化路径：热路径走 Redis `ZREVRANGE ranking:hot-itineraries 0 19`

---

## 3. 优质创作者排行

```sql
-- 场景：按发帖数和总点赞数加权排序
SELECT u.id AS user_id, up.nickname, up.avatar_url,
       COUNT(p.id) AS post_count,
       COALESCE(SUM(p.like_count), 0) AS total_likes
FROM users u
JOIN user_profile up ON up.user_id = u.id
LEFT JOIN posts p ON p.user_id = u.id
GROUP BY u.id, up.nickname, up.avatar_url
ORDER BY total_likes DESC, post_count DESC
LIMIT 10;
```

**EXPLAIN 分析**：
- `type: ALL` on `users`，`ref` on `posts`（通过 `user_id` 关联）
- `Extra: Using temporary; Using filesort` — GROUP BY + ORDER BY
- 优化路径：定时任务预计算写入 Redis，热路径不走此 SQL

---

## 4. 未读通知查询

```sql
-- 场景：获取当前用户的未读通知，按时间倒序
SELECT id, type, title, content, actor_id,
       related_resource_type, related_resource_id,
       read_status, created_at
FROM notifications
WHERE user_id = ? AND read_status = FALSE
ORDER BY created_at DESC
LIMIT 50;
```

**索引**：`idx_notification_user_read_created ON notifications(user_id, read_status, created_at)`

**EXPLAIN 分析**：
- `type: ref` — 精确匹配 `user_id + read_status`
- `key: idx_notification_user_read_created` — 三列联合索引完美覆盖 WHERE + ORDER BY
- `rows: ≤50` — LIMIT 限制
- 这是一个教科书级的联合索引设计：`(等值列, 等值列, 排序列)`

---

## 5. 转化漏斗统计

```sql
-- 场景：统计从"创建任务 → 完成任务 → 发布帖子"的转化漏斗
SELECT
    (SELECT COUNT(*) FROM itinerary_generation_task) AS task_created,
    (SELECT COUNT(*) FROM itinerary_generation_task WHERE status = 'COMPLETED') AS task_completed,
    (SELECT COUNT(*) FROM posts) AS post_published;
```

**索引**：`idx_task_status_created ON itinerary_generation_task(status, created_at)`

**EXPLAIN 分析**：
- 子查询 1：`type: index`，走 PK 计数
- 子查询 2：`type: ref`，走 `status` 索引精确匹配
- 子查询 3：`type: index`，走 PK 计数
- 注意：如果加时间范围过滤（如最近 30 天），可以利用 `(status, created_at)` 联合索引

---

## 6. 热门目的地统计

```sql
-- 场景：从行程标题中提取目的地并统计热度
-- 简化实现：假设标题包含目的地名称
SELECT
    SUBSTRING_INDEX(i.title, ' ', 1) AS destination,
    COUNT(*) AS trip_count
FROM itineraries i
WHERE i.published_at IS NOT NULL
GROUP BY destination
ORDER BY trip_count DESC
LIMIT 10;
```

**EXPLAIN 分析**：
- `type: ALL` — 全表扫描（无法对函数结果建索引）
- `Extra: Using temporary; Using filesort`
- 优化路径：生产环境应单独维护 `destination` 字段或标签表，在行程生成时结构化提取

---

## 7. 用户行程任务列表（分页）

```sql
-- 场景：获取当前用户的行程任务历史
SELECT t.id, t.user_input, t.status, t.prompt_version,
       t.trace_id, t.created_at, t.completed_at,
       i.title AS itinerary_title, i.summary AS itinerary_summary
FROM itinerary_generation_task t
LEFT JOIN itineraries i ON i.task_id = t.id
WHERE t.user_id = ?
ORDER BY t.created_at DESC
LIMIT 20 OFFSET ?;
```

**索引**：`idx_task_user_created ON itinerary_generation_task(user_id, created_at)`

**EXPLAIN 分析**：
- `type: ref` — 走 `user_id` 索引
- `key: idx_task_user_created` — 联合索引覆盖 WHERE + ORDER BY
- LEFT JOIN 走 `itineraries.task_id` 的 UNIQUE 索引

---

## 8. 帖子评论列表

```sql
-- 场景：获取帖子的评论列表，支持嵌套回复
SELECT c.id, c.content, c.parent_id, c.created_at,
       up.nickname, up.avatar_url
FROM comments c
JOIN user_profile up ON up.user_id = c.user_id
WHERE c.post_id = ?
ORDER BY c.created_at ASC;
```

**索引**：`idx_comment_post_created ON comments(post_id, created_at)`

**EXPLAIN 分析**：
- `type: ref` — 走 `post_id` 精确匹配
- `key: idx_comment_post_created` — 覆盖 WHERE + ORDER BY
- 嵌套回复通过 `parent_id` 在应用层组装树结构

---

## 9. 关注关系查询

```sql
-- 场景：检查当前用户是否关注了某用户
SELECT COUNT(*) > 0 AS is_following
FROM follows
WHERE follower_id = ? AND followee_id = ?;

-- 场景：获取用户的关注列表
SELECT f.followee_id, up.nickname, up.avatar_url
FROM follows f
JOIN user_profile up ON up.user_id = f.followee_id
WHERE f.follower_id = ?
ORDER BY f.created_at DESC;
```

**索引**：`uk_follow UNIQUE (follower_id, followee_id)` — 唯一索引同时服务于去重和查询

**EXPLAIN 分析**：
- 查询 1：`type: const`，走唯一索引精确匹配，O(1) 复杂度
- 查询 2：`type: ref`，走 `follower_id` 前缀索引

---

## 10. 运营概览聚合

```sql
-- 场景：首页运营看板一次性聚合
SELECT
    (SELECT COUNT(*) FROM users) AS user_count,
    (SELECT COUNT(*) FROM itinerary_generation_task) AS task_count,
    (SELECT COUNT(*) FROM itinerary_generation_task WHERE status = 'COMPLETED') AS completed_task_count,
    (SELECT COUNT(*) FROM posts) AS post_count,
    (SELECT COUNT(*) FROM comments) AS comment_count;
```

**EXPLAIN 分析**：
- 每个子查询走 PK 的 `type: index` 计数，MySQL 8.0 对 `COUNT(*)` 有优化
- 生产环境应定时写入 Redis 聚合缓存，避免每次访问都执行 5 个 COUNT

---

## 11. 行为事件分析

```sql
-- 场景：统计最近 7 天各事件类型的触发次数（用于行为分析报表）
SELECT event_type, COUNT(*) AS event_count
FROM user_behavior_events
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY event_type
ORDER BY event_count DESC;
```

**索引**：`idx_event_type_created ON user_behavior_events(event_type, created_at)`

**EXPLAIN 分析**：
- `type: range` — 时间范围过滤
- 注意：如果先按 `event_type` 分组再按时间过滤，索引的列顺序 `(event_type, created_at)` 是最优的
- 但如果只有时间过滤，则需要额外的 `(created_at)` 单列索引

---

## 索引设计总结

| 索引类型 | 示例 | 设计原则 |
|---------|------|---------|
| **等值 + 排序** | `(user_id, created_at)` | 等值列在前，排序列在后，避免 filesort |
| **等值 + 等值 + 排序** | `(user_id, read_status, created_at)` | 多等值条件的联合索引 |
| **唯一约束** | `UNIQUE(follower_id, followee_id)` | 既防重复又加速查询 |
| **覆盖索引** | `(status, created_at)` + SELECT 字段 | 减少回表 |
| **前缀匹配** | `UNIQUE(post_id, user_id)` 也服务于 `WHERE post_id = ?` | 联合唯一索引的左前缀天然可用 |
