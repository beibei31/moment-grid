package com.momentgrid.project;

import com.momentgrid.api.ApiDtos.ProjectStatus;
import com.momentgrid.api.ApiDtos.Scene;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Repository
public class InMemoryProjectRepository {

    private final ConcurrentMap<UUID, ProjectRecord> projects = new ConcurrentHashMap<>();

    public ProjectRecord create(Scene scene) {
        ProjectRecord project = new ProjectRecord(UUID.randomUUID(), scene, ProjectStatus.DRAFT);
        projects.put(project.id(), project);
        return project;
    }

    public Optional<ProjectRecord> findById(UUID id) {
        return Optional.ofNullable(projects.get(id));
    }

    public ProjectRecord updateStatus(UUID id, ProjectStatus status) {
        return projects.computeIfPresent(id, (ignored, project) ->
                new ProjectRecord(project.id(), project.scene(), status));
    }
}

record ProjectRecord(UUID id, Scene scene, ProjectStatus status) {
}
