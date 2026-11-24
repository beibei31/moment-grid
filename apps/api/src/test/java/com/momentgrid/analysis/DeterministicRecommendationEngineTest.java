package com.momentgrid.analysis;

import com.momentgrid.api.ApiDtos.AssetInput;
import com.momentgrid.api.ApiDtos.RecommendationPlan;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.HashSet;
import java.util.List;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

class DeterministicRecommendationEngineTest {

    private final DeterministicRecommendationEngine engine = new DeterministicRecommendationEngine();

    @ParameterizedTest
    @CsvSource({
            "1,1,1,1",
            "3,3,3,3",
            "4,4,4,4",
            "6,6,6,4",
            "9,9,6,4",
            "12,9,6,4"
    })
    void shrinksPlanCountsWithoutReferencingMissingAssets(
            int inputCount,
            int storyCount,
            int moodCount,
            int peopleCount
    ) {
        List<AssetInput> assets = assets(inputCount);

        List<RecommendationPlan> plans = engine.generate(assets);

        assertThat(plans).extracting(plan -> plan.assetIds().size())
                .containsExactly(storyCount, moodCount, peopleCount);
        assertThat(plans).flatExtracting(RecommendationPlan::assetIds)
                .allMatch(id -> assets.stream().anyMatch(asset -> asset.id().equals(id)));
        assertThat(plans).allSatisfy(plan ->
                assertThat(new HashSet<>(plan.assetIds())).hasSize(plan.assetIds().size()));
    }

    @Test
    void returnsThreeDistinctKindsInStableOrder() {
        List<AssetInput> assets = assets(12);

        List<RecommendationPlan> first = engine.generate(assets);
        List<RecommendationPlan> second = engine.generate(assets);

        assertThat(first).isEqualTo(second);
        assertThat(first).extracting(RecommendationPlan::kind)
                .containsExactly("STORY", "MOOD", "PEOPLE");
    }

    private static List<AssetInput> assets(int count) {
        return IntStream.range(0, count)
                .mapToObj(index -> new AssetInput(
                        "asset-" + index,
                        index + ".jpg",
                        "image/jpeg",
                        100_000L + index * 1_000L,
                        1200 + index * 10,
                        900 + index * 5,
                        index
                ))
                .toList();
    }
}
