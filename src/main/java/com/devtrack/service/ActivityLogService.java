package com.devtrack.service;

import com.devtrack.entity.ActivityLog;
import com.devtrack.entity.Issue;
import com.devtrack.entity.User;
import com.devtrack.repository.ActivityLogRepository;
import com.devtrack.repository.IssueRepository;
import com.devtrack.exception.ResourceNotFoundException;
import com.devtrack.dto.ActivityLogResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final IssueRepository issueRepository;

    public void logAction(Issue issue, User user, String action, String details) {
        ActivityLog log = ActivityLog.builder()
                .issue(issue)
                .project(issue.getProject())
                .user(user)
                .action(action)
                .details(details)
                .build();
        activityLogRepository.save(log);
    }

    public List<ActivityLogResponse> getLogsByIssueId(Long issueId) {
        if (!issueRepository.existsById(issueId)) {
            throw new ResourceNotFoundException("Issue not found");
        }
        return activityLogRepository.findByIssueIdOrderByCreatedAtDesc(issueId)
                .stream()
                .map(log -> ActivityLogResponse.builder()
                        .id(log.getId())
                        .issueId(log.getIssue().getId())
                        .userId(log.getUser() != null ? log.getUser().getId() : null)
                        .userName(log.getUser() != null ? log.getUser().getFullName() : "System")
                        .action(log.getAction())
                        .details(log.getDetails())
                        .createdAt(log.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
