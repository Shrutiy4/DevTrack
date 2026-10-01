package com.devtrack.service;

import com.devtrack.dto.IssueRequest;
import com.devtrack.dto.IssueResponse;
import com.devtrack.dto.IssueStatusUpdateRequest;
import com.devtrack.entity.Issue;
import com.devtrack.entity.IssueStatus;
import com.devtrack.entity.User;
import com.devtrack.exception.ResourceNotFoundException;
import com.devtrack.repository.IssueRepository;
import com.devtrack.repository.ProjectRepository;
import com.devtrack.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class IssueService {

    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ActivityLogService activityLogService;

    @Transactional
    public IssueResponse createIssue(Long projectId, IssueRequest request) {
        User currentUser = getCurrentUser();
        
        com.devtrack.entity.Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
        }

        Issue issue = Issue.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority())
                .severity(request.getSeverity())
                .status(IssueStatus.OPEN) // Default status
                .project(project)
                .createdBy(currentUser)
                .assignee(assignee)
                .build();

        Issue savedIssue = issueRepository.save(issue);
        
        activityLogService.logAction(savedIssue, currentUser, "ISSUE_CREATED", "Issue was created");
        
        if (assignee != null) {
            activityLogService.logAction(savedIssue, currentUser, "ISSUE_ASSIGNED", "Issue assigned to " + assignee.getFullName());
        }

        return mapToResponse(savedIssue);
    }

    public Page<IssueResponse> getAllIssuesByProjectId(Long projectId, Pageable pageable) {
        return issueRepository.findByProjectId(projectId, pageable).map(this::mapToResponse);
    }

    public IssueResponse getIssueById(Long id) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found with id: " + id));
        return mapToResponse(issue);
    }

    @Transactional
    public IssueResponse updateIssueStatus(Long id, IssueStatusUpdateRequest request) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));
        
        User currentUser = getCurrentUser();
        IssueStatus oldStatus = issue.getStatus();
        
        issue.setStatus(request.getStatus());
        Issue updatedIssue = issueRepository.save(issue);
        
        activityLogService.logAction(updatedIssue, currentUser, "STATUS_CHANGED", 
                "Status changed from " + oldStatus + " to " + request.getStatus());
                
        return mapToResponse(updatedIssue);
    }

    @Transactional
    public IssueResponse assignIssue(Long id, Long assigneeId) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));
        
        User assignee = userRepository.findById(assigneeId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        User currentUser = getCurrentUser();
        issue.setAssignee(assignee);
        
        Issue updatedIssue = issueRepository.save(issue);
        
        activityLogService.logAction(updatedIssue, currentUser, "ISSUE_ASSIGNED", 
                "Issue assigned to " + assignee.getFullName());
                
        return mapToResponse(updatedIssue);
    }

    public void deleteIssue(Long id) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Issue not found"));
        issueRepository.delete(issue);
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Current user not found"));
    }

    private IssueResponse mapToResponse(Issue issue) {
        return IssueResponse.builder()
                .id(issue.getId())
                .title(issue.getTitle())
                .description(issue.getDescription())
                .status(issue.getStatus())
                .priority(issue.getPriority())
                .severity(issue.getSeverity())
                .createdById(issue.getCreatedBy().getId())
                .createdByName(issue.getCreatedBy().getFullName())
                .assigneeId(issue.getAssignee() != null ? issue.getAssignee().getId() : null)
                .assigneeName(issue.getAssignee() != null ? issue.getAssignee().getFullName() : null)
                .createdAt(issue.getCreatedAt())
                .updatedAt(issue.getUpdatedAt())
                .build();
    }
}
