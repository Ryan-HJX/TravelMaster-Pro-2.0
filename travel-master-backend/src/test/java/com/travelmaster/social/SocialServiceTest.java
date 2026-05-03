package com.travelmaster.social;

import com.travelmaster.analytics.service.BehaviorEventService;
import com.travelmaster.auth.service.RateLimitService;
import com.travelmaster.common.exception.AppException;
import com.travelmaster.notification.service.NotificationService;
import com.travelmaster.ranking.service.RankingService;
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
import com.travelmaster.social.service.SocialService;
import com.travelmaster.user.dto.UserProfileResponse;
import com.travelmaster.user.entity.MembershipTier;
import com.travelmaster.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SocialServiceTest {

    @Mock private PostRepository postRepository;
    @Mock private PostLikeRepository postLikeRepository;
    @Mock private PostFavoriteRepository postFavoriteRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private FollowRepository followRepository;
    @Mock private NotificationService notificationService;
    @Mock private RankingService rankingService;
    @Mock private BehaviorEventService behaviorEventService;
    @Mock private UserService userService;
    @Mock private RateLimitService rateLimitService;

    @InjectMocks
    private SocialService socialService;

    private static final String USER_A = "user-a";
    private static final String USER_B = "user-b";
    private static final String POST_ID = "post-001";
    private static final String IP = "127.0.0.1";

    private Post testPost;
    private UserProfileResponse profileA;

    @BeforeEach
    void setUp() {
        testPost = new Post();
        try {
            var field = testPost.getClass().getSuperclass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(testPost, POST_ID);
        } catch (Exception ignored) {}
        testPost.setItineraryId("itinerary-001");
        testPost.setUserId(USER_A);
        testPost.setTitle("Beijing 3 Days");
        testPost.setContentExcerpt("A great trip");
        testPost.setLikeCount(5);
        testPost.setFavoriteCount(2);
        testPost.setCommentCount(1);
        testPost.setPublishedAt(LocalDateTime.now());

        profileA = new UserProfileResponse(
                USER_A, "a@test.com", null, "UserA", null, null,
                MembershipTier.STANDARD, 1, 0, List.of()
        );
    }

    // ---- Like Tests ----

    @Test
    @DisplayName("like - first like increments count and sends notification")
    void likePost_firstLike_success() {
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(testPost));
        when(postLikeRepository.existsByPostIdAndUserId(POST_ID, USER_B)).thenReturn(false);
        when(postLikeRepository.save(any(PostLike.class))).thenAnswer(inv -> inv.getArgument(0));
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userService.getCurrentProfile(anyString())).thenReturn(profileA);
        when(userService.getProfileSafe(anyString())).thenReturn(profileA);
        when(userService.getProfileSafe(anyString())).thenReturn(profileA); // Fix NPE
        when(followRepository.existsByFollowerIdAndFolloweeId(anyString(), anyString())).thenReturn(false);

        PostResponse response = socialService.likePost(USER_B, POST_ID, IP);

        assertEquals(6, response.likeCount());
        verify(postLikeRepository).save(any(PostLike.class));
        verify(rankingService).recordLike(testPost);
        verify(notificationService).createNotification(eq(USER_A), eq(USER_B), any(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("like - duplicate like does not increment count")
    void likePost_duplicate_noIncrement() {
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(testPost));
        when(postLikeRepository.existsByPostIdAndUserId(POST_ID, USER_B)).thenReturn(true);
        when(userService.getCurrentProfile(anyString())).thenReturn(profileA);
        when(userService.getProfileSafe(anyString())).thenReturn(profileA);
        when(followRepository.existsByFollowerIdAndFolloweeId(anyString(), anyString())).thenReturn(false);

        PostResponse response = socialService.likePost(USER_B, POST_ID, IP);

        assertEquals(5, response.likeCount());
        verify(postLikeRepository, never()).save(any());
    }

    @Test
    @DisplayName("like - post not found throws 404")
    void likePost_notFound_throws404() {
        when(postRepository.findById(POST_ID)).thenReturn(Optional.empty());

        assertThrows(AppException.class, () -> socialService.likePost(USER_B, POST_ID, IP));
    }

    @Test
    @DisplayName("like - self like does not send notification")
    void likePost_selfLike_noNotification() {
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(testPost));
        when(postLikeRepository.existsByPostIdAndUserId(POST_ID, USER_A)).thenReturn(false);
        when(postLikeRepository.save(any(PostLike.class))).thenAnswer(inv -> inv.getArgument(0));
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userService.getCurrentProfile(anyString())).thenReturn(profileA);
        when(userService.getProfileSafe(anyString())).thenReturn(profileA);
        when(followRepository.existsByFollowerIdAndFolloweeId(anyString(), anyString())).thenReturn(false);

        socialService.likePost(USER_A, POST_ID, IP);

        verify(notificationService, never()).createNotification(anyString(), anyString(), any(), anyString(), anyString(), anyString(), anyString());
    }

    // ---- Favorite Tests ----

    @Test
    @DisplayName("favorite - first favorite increments count")
    void favoritePost_firstFavorite_success() {
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(testPost));
        when(postFavoriteRepository.existsByPostIdAndUserId(POST_ID, USER_B)).thenReturn(false);
        when(postFavoriteRepository.save(any(PostFavorite.class))).thenAnswer(inv -> inv.getArgument(0));
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userService.getCurrentProfile(anyString())).thenReturn(profileA);
        when(userService.getProfileSafe(anyString())).thenReturn(profileA);
        when(followRepository.existsByFollowerIdAndFolloweeId(anyString(), anyString())).thenReturn(false);

        PostResponse response = socialService.favoritePost(USER_B, POST_ID, IP);

        assertEquals(3, response.favoriteCount());
        verify(postFavoriteRepository).save(any(PostFavorite.class));
    }

    // ---- Comment Tests ----

    @Test
    @DisplayName("comment - creates comment, increments count, sends notification")
    void commentOnPost_success() {
        when(postRepository.findById(POST_ID)).thenReturn(Optional.of(testPost));
        CommentRequest request = new CommentRequest(null, "Great itinerary!");

        Comment saved = new Comment();
        try {
            var field = saved.getClass().getSuperclass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(saved, "comment-001");
            var catField = saved.getClass().getSuperclass().getDeclaredField("createdAt");
            catField.setAccessible(true);
            catField.set(saved, LocalDateTime.now());
        } catch (Exception ignored) {}
        saved.setPostId(POST_ID);
        saved.setUserId(USER_B);
        saved.setContent("Great itinerary!");
        when(commentRepository.save(any(Comment.class))).thenReturn(saved);
        when(postRepository.save(any(Post.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userService.getCurrentProfile(USER_B)).thenReturn(
                new UserProfileResponse(USER_B, null, null, "UserB", null, null, MembershipTier.STANDARD, 1, 0, List.of())
        );

        CommentResponse response = socialService.commentOnPost(USER_B, POST_ID, request, IP);

        assertNotNull(response);
        assertEquals("Great itinerary!", response.content());
        assertEquals(2, testPost.getCommentCount());
        verify(notificationService).createNotification(eq(USER_A), eq(USER_B), any(), anyString(), anyString(), anyString(), anyString());
    }

    // ---- Follow Tests ----

    @Test
    @DisplayName("follow - new follow succeeds and notifies")
    void followUser_success() {
        when(followRepository.existsByFollowerIdAndFolloweeId(USER_A, USER_B)).thenReturn(false);
        when(followRepository.save(any(Follow.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userService.getCurrentProfile(USER_A)).thenReturn(profileA);

        FollowResponse response = socialService.followUser(USER_A, USER_B, IP);

        assertTrue(response.following());
        verify(followRepository).save(any(Follow.class));
        verify(notificationService).createNotification(eq(USER_B), eq(USER_A), any(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("follow - self follow throws BAD_REQUEST")
    void followUser_self_throwsBadRequest() {
        AppException exception = assertThrows(AppException.class,
                () -> socialService.followUser(USER_A, USER_A, IP));
        assertEquals(400, exception.getStatus().value());
    }

    @Test
    @DisplayName("follow - duplicate follow is idempotent")
    void followUser_duplicate_idempotent() {
        when(followRepository.existsByFollowerIdAndFolloweeId(USER_A, USER_B)).thenReturn(true);

        FollowResponse response = socialService.followUser(USER_A, USER_B, IP);

        assertTrue(response.following());
        verify(followRepository, never()).save(any(Follow.class));
        verify(notificationService, never()).createNotification(anyString(), anyString(), any(), anyString(), anyString(), anyString(), anyString());
    }
}
