package com.travelmaster.social.controller;

import com.travelmaster.common.dto.ApiResponse;
import com.travelmaster.security.AuthenticatedUser;
import com.travelmaster.social.dto.CommentRequest;
import com.travelmaster.social.dto.CommentResponse;
import com.travelmaster.social.dto.FollowResponse;
import com.travelmaster.social.dto.PostResponse;
import com.travelmaster.social.service.SocialService;
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

@RestController
@RequestMapping("/api")
public class SocialController {
    private final SocialService socialService;

    public SocialController(SocialService socialService) {
        this.socialService = socialService;
    }

    @GetMapping("/feed")
    public ApiResponse<List<PostResponse>> feed(@RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size,
                                                @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return ApiResponse.success(socialService.getFeed(page, size, currentUser == null ? null : currentUser.userId()));
    }

    @PostMapping("/posts/{id}/like")
    public ApiResponse<PostResponse> like(@AuthenticationPrincipal AuthenticatedUser currentUser,
                                          @PathVariable String id,
                                          HttpServletRequest request) {
        return ApiResponse.success(socialService.likePost(currentUser.userId(), id, request.getRemoteAddr()));
    }

    @PostMapping("/posts/{id}/favorite")
    public ApiResponse<PostResponse> favorite(@AuthenticationPrincipal AuthenticatedUser currentUser,
                                              @PathVariable String id,
                                              HttpServletRequest request) {
        return ApiResponse.success(socialService.favoritePost(currentUser.userId(), id, request.getRemoteAddr()));
    }

    @PostMapping("/posts/{id}/comments")
    public ApiResponse<CommentResponse> comment(@AuthenticationPrincipal AuthenticatedUser currentUser,
                                                @PathVariable String id,
                                                @Valid @RequestBody CommentRequest request,
                                                HttpServletRequest httpRequest) {
        return ApiResponse.success(socialService.commentOnPost(currentUser.userId(), id, request, httpRequest.getRemoteAddr()));
    }

    @GetMapping("/posts/{id}/comments")
    public ApiResponse<List<CommentResponse>> comments(@PathVariable String id) {
        return ApiResponse.success(socialService.listComments(id));
    }

    @PostMapping("/users/{id}/follow")
    public ApiResponse<FollowResponse> follow(@AuthenticationPrincipal AuthenticatedUser currentUser,
                                              @PathVariable String id,
                                              HttpServletRequest request) {
        return ApiResponse.success(socialService.followUser(currentUser.userId(), id, request.getRemoteAddr()));
    }

    @PostMapping("/itineraries/{id}/unpublish")
    public ApiResponse<Void> unpublish(@AuthenticationPrincipal AuthenticatedUser currentUser,
                                       @PathVariable String id) {
        socialService.unpublishByItineraryId(currentUser.userId(), id);
        return ApiResponse.success(null);
    }
}
