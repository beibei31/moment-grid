package com.momentgrid.analysis;

import com.momentgrid.api.ApiDtos.AssetInput;
import com.momentgrid.api.ApiDtos.RecommendationPlan;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Component
public class DeterministicRecommendationEngine {

    public List<RecommendationPlan> generate(List<AssetInput> assets) {
        List<AssetInput> story = assets.stream()
                .sorted(Comparator.comparingInt(AssetInput::originalIndex).thenComparing(AssetInput::id))
                .limit(Math.min(9, assets.size()))
                .toList();
        List<AssetInput> mood = assets.stream()
                .sorted(Comparator.comparingDouble(this::squareDistance)
                        .thenComparing(Comparator.comparingLong(AssetInput::size).reversed())
                        .thenComparingInt(AssetInput::originalIndex)
                        .thenComparing(AssetInput::id))
                .limit(Math.min(6, assets.size()))
                .toList();
        List<AssetInput> people = assets.stream()
                .sorted(Comparator.comparingDouble(this::metadataScore).reversed()
                        .thenComparingInt(AssetInput::originalIndex)
                        .thenComparing(AssetInput::id))
                .limit(Math.min(4, assets.size()))
                .toList();

        List<RecommendationPlan> plans = new ArrayList<>(3);
        plans.add(new RecommendationPlan(
                "story",
                "STORY",
                "故事感方案",
                "沿用拍摄顺序形成自然的开场、展开与收尾。",
                confidence(0.98, story.size(), 9),
                ids(story),
                List.of("按原始顺序保留叙事连贯性", "第 1 张作为朋友圈封面")
        ));
        plans.add(new RecommendationPlan(
                "mood",
                "MOOD",
                "氛围感方案",
                "优先选择画面比例相近的照片，让网格密度更统一。",
                confidence(0.94, mood.size(), 6),
                ids(mood),
                List.of("优先相近的画面比例", "未接视觉模型前不声称识别色温")
        ));
        plans.add(new RecommendationPlan(
                "people",
                "PEOPLE",
                "高光优先方案",
                "依据分辨率、文件大小和版式适配度保留高分照片。",
                confidence(0.91, people.size(), 4),
                ids(people),
                List.of("优先基础元数据评分", "未接人物模型前不声称识别表情或闭眼")
        ));
        return List.copyOf(plans);
    }

    private List<String> ids(List<AssetInput> assets) {
        return assets.stream().map(AssetInput::id).toList();
    }

    private double squareDistance(AssetInput asset) {
        if (asset.width() <= 0 || asset.height() <= 0) return 1.0;
        return Math.abs((double) asset.width() / asset.height() - 1.0);
    }

    private double metadataScore(AssetInput asset) {
        if (asset.width() <= 0 || asset.height() <= 0) return 0.35;
        double megapixels = ((double) asset.width() * asset.height()) / 1_000_000.0;
        double resolution = Math.min(megapixels / 12.0, 1.0);
        double size = Math.min(asset.size() / (5.0 * 1024 * 1024), 1.0);
        double aspectFitness = Math.max(0.0, 1.0 - Math.min(squareDistance(asset), 1.0));
        return resolution * 0.65 + aspectFitness * 0.20 + size * 0.15;
    }

    private double confidence(double ideal, int actual, int target) {
        double ratio = Math.min(1.0, (double) actual / target);
        return Math.round((ideal - (1.0 - ratio) * 0.10) * 100.0) / 100.0;
    }
}
