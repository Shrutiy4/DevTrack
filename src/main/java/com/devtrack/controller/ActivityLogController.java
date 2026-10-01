package com.devtrack.controller;

import com.devtrack.dto.ActivityLogResponse;
import com.devtrack.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/issues/{issueId}/logs")
@RequiredArgsConstructor
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @GetMapping
    public ResponseEntity<List<ActivityLogResponse>> getIssueLogs(@PathVariable Long issueId) {
        return ResponseEntity.ok(activityLogService.getLogsByIssueId(issueId));
    }
}
