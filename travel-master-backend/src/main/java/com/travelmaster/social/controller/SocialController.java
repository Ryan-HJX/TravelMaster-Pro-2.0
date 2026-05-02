package com.travelmaster.social.controller;

import com.travelmaster.common.dto.ApiResponse;
import com.travelmaster.security.AuthenticatedUser;
import com.travelmaster.social.dto.CommentRequest;
import com.travelmaster.social.dto.CommentResponse;
import com.travelmaster.social.dto.FollowResponse;
import com.travelmaster.social.dto.PostResponse;
import com.travelmaster.social.service.SocialService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 社交控制器
 * 
 * 提供点赞、评论、收藏、关注等社交互动功能
 */
@RestController
@RequestMapping("/api")
@Tag(name = "社交模块", description = "点赞、评论、收藏、关注等社交互动接口")
public class SocialController {
    private final SocialService socialService;

    public SocialController(SocialService socialService) {
        this.socialService = socialService;
    }

    @GetMapping("/feed")
    @Operation(
        summary = "获取社交 Feed",
        description = "分页获取发布的行程帖子列表，支持未登录用户浏览"
    )
    public ApiResponse<List<PostResponse>> feed(
            @Parameter(description = "页码，从 0 开始", example = "0")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "每页数量", example = "10")
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return ApiResponse.success(socialService.getFeed(page, size, currentUser == null ? null : currentUser.userId()));
    }

    @PostMapping("/posts/{id}/like")
    @Operation(
        summary = "点赞/取消点赞",
        description = "对帖子进行点赞或取消点赞操作（切换状态）"
    )
    public ApiResponse<PostResponse> like(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Parameter(description = "帖子 ID", example = "post-123")
            @PathVariable String id,
            HttpServletRequest request) {
        return ApiResponse.success(socialService.likePost(currentUser.userId(), id, request.getRemoteAddr()));
    }

    @PostMapping("/posts/{id}/favorite")
    @Operation(
        summary = "收藏/取消收藏",
        description = "收藏或取消收藏帖子（切换状态）"
    )
    public ApiResponse<PostResponse> favorite(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Parameter(description = "帖子 ID", example = "post-123")
            @PathVariable String id,
            HttpServletRequest request) {
        return ApiResponse.success(socialService.favoritePost(currentUser.userId(), id, request.getRemoteAddr()));
    }

    @PostMapping("/posts/{id}/comments")
    @Operation(
        summary = "发表评论",
        description = "在帖子下发表评论"
    )
    public ApiResponse<CommentResponse> comment(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Parameter(description = "帖子 ID", example = "post-123")
            @PathVariable String id,
            @Valid @RequestBody CommentRequest request,
            HttpServletRequest httpRequest) {
        return ApiResponse.success(socialService.commentOnPost(currentUser.userId(), id, request, httpRequest.getRemoteAddr()));
    }

    @GetMapping("/posts/{id}/comments")
    @Operation(
        summary = "获取评论列表",
        description = "获取指定帖子的所有评论"
    )
    public ApiResponse<List<CommentResponse>> comments(
            @Parameter(description = "帖子 ID", example = "post-123")
            @PathVariable String id) {
        return ApiResponse.success(socialService.listComments(id));
    }

    @PostMapping("/users/{id}/follow")
    @Operation(
        summary = "关注/取消关注",
        description = "关注或取消关注其他用户（切换状态）"
    )
    public ApiResponse<FollowResponse> follow(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Parameter(description = "目标用户 ID", example = "user-456")
            @PathVariable String id,
            HttpServletRequest request) {
        return ApiResponse.success(socialService.followUser(currentUser.userId(), id, request.getRemoteAddr()));
    }

    @PostMapping("/itineraries/{id}/unpublish")
    @Operation(
        summary = "取消发布行程",
        description = "将已发布的行程帖子下架（仅作者可操作）"
    )
    public ApiResponse<Void> unpublish(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Parameter(description = "行程 ID", example = "itin-789")
            @PathVariable String id) {
        socialService.unpublishByItineraryId(currentUser.userId(), id);
        return ApiResponse.success(null);
    }
}
