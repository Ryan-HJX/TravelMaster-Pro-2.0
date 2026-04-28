package com.travelmaster.ranking.service;

import com.travelmaster.social.dto.AuthorSummaryResponse;
import com.travelmaster.social.dto.PostResponse;
import com.travelmaster.social.entity.Post;
import com.travelmaster.social.repository.PostRepository;
import com.travelmaster.user.dto.UserProfileResponse;
import com.travelmaster.user.service.UserService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class RankingService {
    private static final String HOT_POSTS_KEY = "ranking:hot-posts";
    private static final String TOP_CREATORS_KEY = "ranking:top-creators";

    private final StringRedisTemplate redisTemplate;
    private final PostRepository postRepository;
    private final UserService userService;

    public RankingService(StringRedisTemplate redisTemplate, PostRepository postRepository, UserService userService) {
        this.redisTemplate = redisTemplate;
        this.postRepository = postRepository;
        this.userService = userService;
    }

    public void recordPublished(Post post) {
        redisTemplate.opsForZSet().incrementScore(HOT_POSTS_KEY, post.getId(), 1);
        redisTemplate.opsForZSet().incrementScore(TOP_CREATORS_KEY, post.getUserId(), 1);
        redisTemplate.expire(HOT_POSTS_KEY, Duration.ofDays(7));
        redisTemplate.expire(TOP_CREATORS_KEY, Duration.ofDays(7));
    }

    public void recordLike(Post post) {
        redisTemplate.opsForZSet().incrementScore(HOT_POSTS_KEY, post.getId(), 3);
        redisTemplate.opsForZSet().incrementScore(TOP_CREATORS_KEY, post.getUserId(), 2);
    }

    public void recordComment(Post post) {
        redisTemplate.opsForZSet().incrementScore(HOT_POSTS_KEY, post.getId(), 2);
        redisTemplate.opsForZSet().incrementScore(TOP_CREATORS_KEY, post.getUserId(), 1);
    }

    @Cacheable(cacheNames = "hotItineraries", key = "'top:' + #limit")
    public List<PostResponse> hotItineraries(int limit) {
        Set<ZSetOperations.TypedTuple<String>> ranked = redisTemplate.opsForZSet()
                .reverseRangeWithScores(HOT_POSTS_KEY, 0, Math.max(0, limit - 1));
        List<PostResponse> response = new ArrayList<>();
        if (ranked == null || ranked.isEmpty()) {
            return postRepository.findTop10ByOrderByLikeCountDescPublishedAtDesc().stream()
                    .limit(limit)
                    .map(post -> toPostResponse(post, false, false))
                    .toList();
        }
        for (ZSetOperations.TypedTuple<String> tuple : ranked) {
            if (tuple.getValue() == null) {
                continue;
            }
            postRepository.findById(tuple.getValue())
                    .map(post -> toPostResponse(post, false, false))
                    .ifPresent(response::add);
        }
        return response;
    }

    @Cacheable(cacheNames = "creatorRanking", key = "'top:' + #limit")
    public List<AuthorSummaryResponse> topCreators(int limit) {
        Set<String> ranked = redisTemplate.opsForZSet().reverseRange(TOP_CREATORS_KEY, 0, Math.max(0, limit - 1));
        if (ranked == null || ranked.isEmpty()) {
            return List.of();
        }
        return ranked.stream()
                .map(userService::getCurrentProfile)
                .map(profile -> new AuthorSummaryResponse(profile.userId(), profile.nickname(), profile.avatarUrl(), false))
                .toList();
    }

    private PostResponse toPostResponse(Post post, boolean liked, boolean favorited) {
        UserProfileResponse profile = userService.getCurrentProfile(post.getUserId());
        return new PostResponse(
                post.getId(),
                post.getItineraryId(),
                post.getTitle(),
                post.getContentExcerpt(),
                post.getLikeCount(),
                post.getFavoriteCount(),
                post.getCommentCount(),
                liked,
                favorited,
                new AuthorSummaryResponse(profile.userId(), profile.nickname(), profile.avatarUrl(), false),
                post.getPublishedAt()
        );
    }
}
