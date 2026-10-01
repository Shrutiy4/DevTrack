package com.devtrack.controller;

import com.devtrack.entity.Project;
import com.devtrack.entity.User;
import com.devtrack.repository.ProjectRepository;
import com.devtrack.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        User user = getAuthenticatedUser();
        return ResponseEntity.ok(projectRepository.findByCreatedByOrderByNameAsc(user));
    }

    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String description = request.get("description");

        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Project name is required"));
        }

        User user = getAuthenticatedUser();
        
        Project project = Project.builder()
                .name(name.trim())
                .description(description)
                .createdBy(user)
                .build();

        projectRepository.save(project);
        return ResponseEntity.ok(project);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable Long id) {
        Project project = projectRepository.findById(id).orElse(null);
        if (project == null) {
            return ResponseEntity.notFound().build();
        }
        
        User user = getAuthenticatedUser();
        if (!project.getCreatedBy().getId().equals(user.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "You don't have permission to delete this project"));
        }
        
        // Note: Due to foreign key constraints, deleting a project will fail if it has issues,
        // unless Cascade is set or issues are deleted first. 
        // For simplicity in this iteration, we'll try to delete it directly.
        try {
            projectRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Project deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Cannot delete project with existing issues."));
        }
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
    }
}
