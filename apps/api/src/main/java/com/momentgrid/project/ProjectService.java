package com.momentgrid.project;

import com.momentgrid.api.ApiDtos.ProjectResponse;
import com.momentgrid.api.ApiDtos.ProjectStatus;
import com.momentgrid.api.ApiDtos.Scene;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ProjectService {

    private final InMemoryProjectRepository repository;

    public ProjectService(InMemoryProjectRepository repository) {
        this.repository = repository;
    }

    public ProjectResponse create(Scene requestedScene) {
        ProjectRecord project = repository.create(requestedScene == null ? Scene.DAILY : requestedScene);
        return new ProjectResponse(project.id(), project.status());
    }

    public Scene requireScene(UUID projectId) {
        return require(projectId).scene();
    }

    public void markReady(UUID projectId) {
        require(projectId);
        repository.updateStatus(projectId, ProjectStatus.READY);
    }

    private ProjectRecord require(UUID projectId) {
        return repository.findById(projectId)
                .orElseThrow(ProjectNotFoundException::new);
    }

    public static class ProjectNotFoundException extends RuntimeException {
        public ProjectNotFoundException() {
            super("作品不存在或已失效");
        }
    }
}
