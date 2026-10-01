package com.devtrack.repository;

import com.devtrack.entity.Project;
import com.devtrack.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findAllByOrderByNameAsc();
    List<Project> findByCreatedByOrderByNameAsc(User createdBy);
}
