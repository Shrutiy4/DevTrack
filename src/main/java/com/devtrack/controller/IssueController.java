package com.devtrack.controller;

import com.devtrack.dto.IssueRequest;
import com.devtrack.dto.IssueResponse;
import com.devtrack.dto.IssueStatusUpdateRequest;
import com.devtrack.service.IssueService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.web.PageableDefault;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/issues")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;

    @PostMapping
    public ResponseEntity<IssueResponse> createIssue(
            @PathVariable Long projectId,
            @Valid @RequestBody IssueRequest request) {
        return new ResponseEntity<>(issueService.createIssue(projectId, request), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<Page<IssueResponse>> getAllIssues(
            @PathVariable Long projectId,
            @PageableDefault(size = 100) Pageable pageable) {
        return ResponseEntity.ok(issueService.getAllIssuesByProjectId(projectId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<IssueResponse> getIssueById(@PathVariable Long id) {
        return ResponseEntity.ok(issueService.getIssueById(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<IssueResponse> updateIssueStatus(
            @PathVariable Long id, 
            @Valid @RequestBody IssueStatusUpdateRequest request) {
        return ResponseEntity.ok(issueService.updateIssueStatus(id, request));
    }

    @PatchMapping("/{id}/assign/{assigneeId}")
    public ResponseEntity<IssueResponse> assignIssue(
            @PathVariable Long id, 
            @PathVariable Long assigneeId) {
        return ResponseEntity.ok(issueService.assignIssue(id, assigneeId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteIssue(@PathVariable Long id) {
        issueService.deleteIssue(id);
        return ResponseEntity.noContent().build();
    }
}
