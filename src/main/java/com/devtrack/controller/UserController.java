package com.devtrack.controller;

import com.devtrack.dto.AuthResponse;
import com.devtrack.dto.UserUpdateRequest;
import com.devtrack.entity.User;
import com.devtrack.exception.ResourceNotFoundException;
import com.devtrack.repository.UserRepository;
import com.devtrack.repository.IssueRepository;
import com.devtrack.entity.Issue;
import com.devtrack.dto.UserDeleteRequest;
import com.devtrack.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final IssueRepository issueRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser() {
        User user = getAuthenticatedUser();
        AuthResponse response = AuthResponse.builder()
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/me")
    public ResponseEntity<AuthResponse> updateCurrentUser(@Valid @RequestBody UserUpdateRequest request) {
        User user = getAuthenticatedUser();
        user.setFullName(request.getFullName());
        userRepository.save(user);

        // Generate a new token with updated claims if needed, but here we just return the same token payload structure
        String token = jwtUtil.generateToken(user);
        
        AuthResponse response = AuthResponse.builder()
                .token(token)
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
                
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/me")
    public ResponseEntity<?> deleteCurrentUser(@Valid @RequestBody UserDeleteRequest request) {
        User user = getAuthenticatedUser();

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(403).body(java.util.Map.of("message", "Incorrect password"));
        }

        // Unassign user from issues before deletion to prevent foreign key errors (assignee does not cascade delete)
        java.util.List<Issue> assignedIssues = issueRepository.findByAssigneeId(user.getId());
        for (Issue issue : assignedIssues) {
            issue.setAssignee(null);
            issueRepository.save(issue);
        }

        userRepository.delete(user);
        return ResponseEntity.ok(java.util.Map.of("message", "Account deleted successfully"));
    }

    private User getAuthenticatedUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
