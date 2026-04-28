-- 修复外键约束，添加级联删除
-- 问题：删除帖子时，由于 post_likes 和 post_favorites 表的外键约束导致删除失败
-- 解决：修改外键为 ON DELETE CASCADE，自动删除关联的点赞和收藏记录

-- 1. 删除 post_likes 表的旧外键约束
ALTER TABLE post_likes DROP FOREIGN KEY fk_post_like_post;
ALTER TABLE post_likes DROP FOREIGN KEY fk_post_like_user;

-- 2. 重新添加带级联删除的外键约束
ALTER TABLE post_likes 
    ADD CONSTRAINT fk_post_like_post 
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_post_like_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. 删除 post_favorites 表的旧外键约束
ALTER TABLE post_favorites DROP FOREIGN KEY fk_post_favorite_post;
ALTER TABLE post_favorites DROP FOREIGN KEY fk_post_favorite_user;

-- 4. 重新添加带级联删除的外键约束
ALTER TABLE post_favorites 
    ADD CONSTRAINT fk_post_favorite_post 
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_post_favorite_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 5. 修复 comments 表的外键约束
ALTER TABLE comments DROP FOREIGN KEY fk_comment_post;
ALTER TABLE comments DROP FOREIGN KEY fk_comment_user;

ALTER TABLE comments 
    ADD CONSTRAINT fk_comment_post 
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_comment_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
