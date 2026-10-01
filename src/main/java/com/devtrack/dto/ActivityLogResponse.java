package com.devtrack.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ActivityLogResponse {
    private Long id;
    private Long issueId;
    private Long userId;
    private String userName;
    private String action;
    private String details;
    private LocalDateTime createdAt;
}
