package com.momentgrid.caption;

import com.momentgrid.api.ApiDtos.CaptionCandidate;
import com.momentgrid.api.ApiDtos.Scene;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CaptionFactoryTest {

    private final CaptionFactory factory = new CaptionFactory();

    @Test
    void createsSixDistinctStylesWithoutInventingWeatherOrActivities() {
        List<CaptionCandidate> captions = factory.create(Scene.DAILY);

        assertThat(captions).hasSize(6);
        assertThat(captions).extracting(CaptionCandidate::style)
                .containsExactlyInAnyOrder(
                        "MINIMAL", "NATURAL", "STORY", "HUMOR", "POETIC", "INFORMATIONAL"
                );
        assertThat(captions).extracting(CaptionCandidate::text)
                .allSatisfy(text -> assertThat(text)
                        .doesNotContain("晴天")
                        .doesNotContain("散步"));
        assertThat(captions.stream()
                .filter(candidate -> candidate.style().equals("INFORMATIONAL"))
                .findFirst()
                .orElseThrow()
                .reason()).doesNotContain("已知");
    }
}
