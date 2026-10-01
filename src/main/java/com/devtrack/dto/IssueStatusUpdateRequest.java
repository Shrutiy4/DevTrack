package com.devtrack.dto;

import com.devtrack.entity.IssueStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IssueStatusUpdateRequest {
    @NotNull(message = "Status is required")
    private IssueStatus status;
}
