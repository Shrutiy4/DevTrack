package com.devtrack.repository;

import com.devtrack.entity.Issue;
import com.devtrack.entity.IssuePriority;
import com.devtrack.entity.IssueStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IssueRepository extends JpaRepository<Issue, Long> {
    Page<Issue> findByProjectId(Long projectId, Pageable pageable);
    Page<Issue> findByProjectIdAndStatus(Long projectId, IssueStatus status, Pageable pageable);
    Page<Issue> findByProjectIdAndPriority(Long projectId, IssuePriority priority, Pageable pageable);
    Page<Issue> findByProjectIdAndAssigneeId(Long projectId, Long assigneeId, Pageable pageable);
    java.util.List<Issue> findByAssigneeId(Long assigneeId);
}
