package com.momentgrid.analysis;

import com.momentgrid.api.ApiDtos.AnalysisResult;
import com.momentgrid.api.ApiDtos.AnalyzeRequest;
import com.momentgrid.api.ApiDtos.AssetInput;
import com.momentgrid.api.ApiDtos.RecommendationPlan;
import com.momentgrid.caption.CaptionFactory;
import com.momentgrid.project.ProjectService;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AnalysisService {

    public static final String ENGINE_VERSION = "metadata-mvp-v1";

    private final ProjectService projectService;
    private final DeterministicRecommendationEngine recommendationEngine;
    private final CaptionFactory captionFactory;

    public AnalysisService(
            ProjectService projectService,
            DeterministicRecommendationEngine recommendationEngine,
            CaptionFactory captionFactory
    ) {
        this.projectService = projectService;
        this.recommendationEngine = recommendationEngine;
        this.captionFactory = captionFactory;
    }

    public AnalysisResult analyze(UUID projectId, AnalyzeRequest request) {
        var projectScene = projectService.requireScene(projectId);
        ensureUniqueIds(request.assets());
        List<RecommendationPlan> plans = recommendationEngine.generate(request.assets());
        Set<String> selectedIds = plans.stream()
                .flatMap(plan -> plan.assetIds().stream())
                .collect(Collectors.toSet());
        int excludedCount = (int) request.assets().stream()
                .filter(asset -> !selectedIds.contains(asset.id()))
                .count();
        projectService.markReady(projectId);
        return new AnalysisResult(
                ENGINE_VERSION,
                excludedCount,
                plans,
                captionFactory.create(request.scene() == null ? projectScene : request.scene())
        );
    }

    private void ensureUniqueIds(List<AssetInput> assets) {
        Set<String> ids = new HashSet<>();
        boolean duplicate = assets.stream().map(AssetInput::id).anyMatch(id -> !ids.add(id));
        if (duplicate) throw new InvalidRequestException("图片 ID 不能重复");
    }

    public static class InvalidRequestException extends RuntimeException {
        public InvalidRequestException(String message) {
            super(message);
        }
    }
}
