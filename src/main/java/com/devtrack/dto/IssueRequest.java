package com.devtrack.dto;

import com.devtrack.entity.IssuePriority;
import com.devtrack.entity.IssueSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class IssueRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Priority is required")
    private IssuePriority priority;

    @NotNull(message = "Severity is required")
    private IssueSeverity severity;
    
    private Long assigneeId;
}
