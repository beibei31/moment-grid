package com.momentgrid.analysis;

import com.momentgrid.api.ApiDtos.AnalysisResult;
import com.momentgrid.api.ApiDtos.AnalyzeRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/analysis")
public class AnalysisController {

    private final AnalysisService analysisService;

    public AnalysisController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @PostMapping
    public AnalysisResult analyze(
            @org.springframework.web.bind.annotation.PathVariable UUID projectId,
            @Valid @RequestBody AnalyzeRequest request
    ) {
        return analysisService.analyze(projectId, request);
    }
}
