package com.momentgrid.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class ApiDtos {

    private ApiDtos() {
    }

    public enum Scene {
        TRAVEL, FOOD, PARTY, DAILY, FAMILY, PET, CUSTOM
    }

    public enum ProjectStatus {
        DRAFT, READY
    }

    public record CreateProjectRequest(Scene scene) {
    }

    public record ProjectResponse(UUID projectId, ProjectStatus status) {
    }

    public record AnalyzeRequest(
            @NotEmpty(message = "至少需要一张照片")
            @Size(max = 50, message = "单次最多支持 50 张照片")
            List<@NotNull(message = "图片项不能为空") @Valid AssetInput> assets,
            Scene scene
    ) {
    }

    public record AssetInput(
            @NotBlank(message = "图片 ID 不能为空") String id,
            @NotBlank(message = "文件名不能为空") String name,
            @NotBlank(message = "MIME 类型不能为空") String mimeType,
            @PositiveOrZero(message = "文件大小不能为负数") long size,
            @PositiveOrZero(message = "图片宽度不能为负数") int width,
            @PositiveOrZero(message = "图片高度不能为负数") int height,
            @PositiveOrZero(message = "原始顺序不能为负数") int originalIndex
    ) {
    }

    public record RecommendationPlan(
            String id,
            String kind,
            String title,
            String summary,
            double confidence,
            List<String> assetIds,
            List<String> reasons
    ) {
        public RecommendationPlan {
            assetIds = List.copyOf(assetIds);
            reasons = List.copyOf(reasons);
        }
    }

    public record CaptionCandidate(
            String id,
            String style,
            String text,
            String reason
    ) {
    }

    public record AnalysisResult(
            String engineVersion,
            int excludedCount,
            List<RecommendationPlan> plans,
            List<CaptionCandidate> captions
    ) {
        public AnalysisResult {
            plans = List.copyOf(plans);
            captions = List.copyOf(captions);
        }
    }

    public record ApiError(
            String code,
            String message,
            Map<String, String> fieldErrors
    ) {
        public ApiError {
            fieldErrors = Map.copyOf(fieldErrors);
        }
    }
}
