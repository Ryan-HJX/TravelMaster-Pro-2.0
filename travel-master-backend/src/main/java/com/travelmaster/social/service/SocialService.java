package com.travelmaster.social.service;

import com.travelmaster.analytics.service.BehaviorEventService;
import com.travelmaster.auth.service.RateLimitService;
import com.travelmaster.common.exception.AppException;
import com.travelmaster.notification.entity.NotificationType;
import com.travelmaster.notification.service.NotificationService;
import com.travelmaster.ranking.service.RankingService;
import com.travelmaster.social.dto.AuthorSummaryResponse;
import com.travelmaster.social.dto.CommentRequest;
import com.travelmaster.social.dto.CommentResponse;
import com.travelmaster.social.dto.FollowResponse;
import com.travelmaster.social.dto.PostResponse;
import com.travelmaster.social.entity.Comment;
import com.travelmaster.social.entity.Follow;
import com.travelmaster.social.entity.Post;
import com.travelmaster.social.entity.PostFavorite;
import com.travelmaster.social.entity.PostLike;
import com.travelmaster.social.repository.CommentRepository;
import com.travelmaster.social.repository.FollowRepository;
import com.travelmaster.social.repository.PostFavoriteRepository;
import com.travelmaster.social.repository.PostLikeRepository;
import com.travelmaster.social.repository.PostRepository;
import com.travelmaster.user.dto.UserProfileResponse;
import com.travelmaster.user.service.UserService;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class SocialService {
    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostFavoriteRepository postFavoriteRepository;
    private final CommentRepository commentRepository;
    private final FollowRepository followRepository;
    private final NotificationService notificationService;
    private final RankingService rankingService;
    private final BehaviorEventService behaviorEventService;
    private final UserService userService;
    private final RateLimitService rateLimitService;

    public SocialService(PostRepository postRepository,
                         PostLikeRepository postLikeRepository,
                         PostFavoriteRepository postFavoriteRepository,
                         CommentRepository commentRepository,
                         FollowRepository followRepository,
                         NotificationService notificationService,
                         RankingService rankingService,
                         BehaviorEventService behaviorEventService,
                         UserService userService,
                         RateLimitService rateLimitService) {
        this.postRepository = postRepository;
        this.postLikeRepository = postLikeRepository;
        this.postFavoriteRepository = postFavoriteRepository;
        this.commentRepository = commentRepository;
        this.followRepository = followRepository;
        this.notificationService = notificationService;
        this.rankingService = rankingService;
        this.behaviorEventService = behaviorEventService;
        this.userService = userService;
        this.rateLimitService = rateLimitService;
    }

    @Cacheable(cacheNames = "postFeed", key = "#page + ':' + #size + ':' + (#viewerUserId == null ? 'guest' : #viewerUserId)")
    public List<PostResponse> getFeed(int page, int size, String viewerUserId) {
        return postRepository.findAllByOrderByPublishedAtDesc(PageRequest.of(page, size)).stream()
                .map(post -> toPostResponse(post, viewerUserId))
                .toList();
    }

    @Transactional
    @CacheEvict(cacheNames = {"postFeed", "postDetail", "hotItineraries", "creatorRanking"}, allEntries = true)
    public PostResponse likePost(String userId, String postId, String ip) {
        rateLimitService.assertWithinLimit("post-like", userId, ip, 50, 120, Duration.ofMinutes(1));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "post not found"));
        if (!postLikeRepository.existsByPostIdAndUserId(postId, userId)) {
            PostLike like = new PostLike();
            like.setPostId(postId);
            like.setUserId(userId);
            postLikeRepository.save(like);
            post.setLikeCount(post.getLikeCount() + 1);
            postRepository.save(post);
            rankingService.recordLike(post);
            behaviorEventService.log(userId, "POST_LIKED", "post", postId, Map.of());
            if (!userId.equals(post.getUserId())) {
                notificationService.createNotification(post.getUserId(), userId, NotificationType.POST_LIKED,
                        "Your itinerary received a like", post.getTitle(), "post", postId);
            }
        }
        return toPostResponse(post, userId);
    }

    @Transactional
    @CacheEvict(cacheNames = {"postFeed", "postDetail"}, allEntries = true)
    public PostResponse favoritePost(String userId, String postId, String ip) {
        rateLimitService.assertWithinLimit("post-favorite", userId, ip, 50, 120, Duration.ofMinutes(1));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "post not found"));
        if (!postFavoriteRepository.existsByPostIdAndUserId(postId, userId)) {
            PostFavorite favorite = new PostFavorite();
            favorite.setPostId(postId);
            favorite.setUserId(userId);
            postFavoriteRepository.save(favorite);
            post.setFavoriteCount(post.getFavoriteCount() + 1);
            postRepository.save(post);
            behaviorEventService.log(userId, "POST_FAVORITED", "post", postId, Map.of());
        }
        return toPostResponse(post, userId);
    }

    @Transactional
    @CacheEvict(cacheNames = {"postFeed", "postDetail", "hotItineraries", "creatorRanking"}, allEntries = true)
    public CommentResponse commentOnPost(String userId, String postId, CommentRequest request, String ip) {
        rateLimitService.assertWithinLimit("post-comment", userId, ip, 30, 90, Duration.ofMinutes(1));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "post not found"));
        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setUserId(userId);
        comment.setParentId(request.parentId());
        comment.setContent(request.content());
        Comment saved = commentRepository.save(comment);
        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);
        rankingService.recordComment(post);
        behaviorEventService.log(userId, "POST_COMMENTED", "post", postId, Map.of());
        if (!userId.equals(post.getUserId())) {
            notificationService.createNotification(post.getUserId(), userId, NotificationType.POST_COMMENTED,
                    "Your itinerary has a new comment", request.content(), "post", postId);
        }
        UserProfileResponse profile = userService.getCurrentProfile(userId);
        return new CommentResponse(saved.getId(), saved.getContent(), saved.getParentId(), userId, profile.nickname(), saved.getCreatedAt());
    }

    @Transactional
    @CacheEvict(cacheNames = {"creatorRanking", "postFeed"}, allEntries = true)
    public FollowResponse followUser(String followerId, String followeeId, String ip) {
        if (followerId.equals(followeeId)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "cannot follow yourself");
        }
        rateLimitService.assertWithinLimit("follow-user", followerId, ip, 30, 90, Duration.ofMinutes(1));
        if (!followRepository.existsByFollowerIdAndFolloweeId(followerId, followeeId)) {
            Follow follow = new Follow();
            follow.setFollowerId(followerId);
            follow.setFolloweeId(followeeId);
            followRepository.save(follow);
            behaviorEventService.log(followerId, "USER_FOLLOWED", "user", followeeId, Map.of());
            notificationService.createNotification(followeeId, followerId, NotificationType.USER_FOLLOWED,
                    "You have a new follower", userService.getCurrentProfile(followerId).nickname(), "user", followerId);
        }
        return new FollowResponse(followerId, followeeId, true);
    }

    public List<CommentResponse> listComments(String postId) {
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream()
                .map(comment -> new CommentResponse(
                        comment.getId(),
                        comment.getContent(),
                        comment.getParentId(),
                        comment.getUserId(),
                        userService.getCurrentProfile(comment.getUserId()).nickname(),
                        comment.getCreatedAt()
                ))
                .toList();
    }

    private PostResponse toPostResponse(Post post, String viewerUserId) {
        boolean liked = viewerUserId != null && postLikeRepository.existsByPostIdAndUserId(post.getId(), viewerUserId);
        boolean favorited = viewerUserId != null && postFavoriteRepository.existsByPostIdAndUserId(post.getId(), viewerUserId);
        UserProfileResponse author = userService.getCurrentProfile(post.getUserId());
        boolean following = viewerUserId != null && followRepository.existsByFollowerIdAndFolloweeId(viewerUserId, post.getUserId());
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
                new AuthorSummaryResponse(author.userId(), author.nickname(), author.avatarUrl(), following),
                post.getPublishedAt()
        );
    }
}
