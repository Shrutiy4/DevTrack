package com.devtrack.service;

import com.devtrack.dto.CommentRequest;
import com.devtrack.dto.CommentResponse;
import com.devtrack.entity.Comment;
import com.devtrack.entity.Issue;
import com.devtrack.entity.User;
import com.devtrack.exception.ResourceNotFoundException;
import com.devtrack.repository.CommentRepository;
import com.devtrack.repository.IssueRepository;
import com.devtrack.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;

    public CommentResponse addComment(Long issueId, CommentRequest request) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));

        User currentUser = getCurrentUser();

        Comment comment = Comment.builder()
                .content(request.getContent())
                .issue(issue)
                .user(currentUser)
                .build();

        Comment savedComment = commentRepository.save(comment);

        activityLogService.logAction(issue, currentUser, "COMMENT_ADDED", "User added a comment");

        return mapToResponse(savedComment);
    }

    public List<CommentResponse> getCommentsByIssueId(Long issueId) {
        if (!issueRepository.existsById(issueId)) {
            throw new ResourceNotFoundException("Issue not found");
        }
        
        return commentRepository.findByIssueIdOrderByCreatedAtAsc(issueId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
    }

    private CommentResponse mapToResponse(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .issueId(comment.getIssue().getId())
                .userId(comment.getUser().getId())
                .userName(comment.getUser().getFullName())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
