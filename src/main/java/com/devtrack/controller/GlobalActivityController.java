package com.devtrack.controller;

import com.devtrack.dto.ActivityLogResponse;
import com.devtrack.entity.ActivityLog;
import com.devtrack.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.bind.annotation.PathVariable;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/activity")
@RequiredArgsConstructor
public class GlobalActivityController {

    private final ActivityLogRepository activityLogRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<ActivityLogResponse>> getGlobalActivity(@PathVariable Long projectId) {
        List<ActivityLogResponse> logs = activityLogRepository.findTop50ByProjectIdOrderByCreatedAtDesc(projectId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(logs);
    }

    private ActivityLogResponse mapToResponse(ActivityLog log) {
        return ActivityLogResponse.builder()
                .id(log.getId())
                .action(log.getAction())
                .details(log.getDetails())
                .createdAt(log.getCreatedAt())
                .userId(log.getUser() != null ? log.getUser().getId() : null)
                .userName(log.getUser() != null ? log.getUser().getFullName() : null)
                .build();
    }
}
