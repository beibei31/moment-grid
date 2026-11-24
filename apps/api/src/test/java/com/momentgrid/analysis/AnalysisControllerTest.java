package com.momentgrid.analysis;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AnalysisControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private String projectId;

    @BeforeEach
    void createProject() throws Exception {
        String body = mockMvc.perform(post("/api/v1/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scene\":\"DAILY\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        projectId = JsonPath.read(body, "$.projectId");
    }

    @Test
    void returnsThreePlansAndSixCaptionStylesForNineAssets() throws Exception {
        mockMvc.perform(post("/api/v1/projects/{projectId}/analysis", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(analysisBody(9)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.engineVersion").value("metadata-mvp-v1"))
                .andExpect(jsonPath("$.plans.length()").value(3))
                .andExpect(jsonPath("$.plans[0].kind").value("STORY"))
                .andExpect(jsonPath("$.plans[1].kind").value("MOOD"))
                .andExpect(jsonPath("$.plans[2].kind").value("PEOPLE"))
                .andExpect(jsonPath("$.captions.length()").value(6))
                .andExpect(jsonPath("$.captions[*].style").value(
                        org.hamcrest.Matchers.containsInAnyOrder(
                                "MINIMAL", "NATURAL", "STORY", "HUMOR", "POETIC", "INFORMATIONAL"
                        )
                ));
    }

    @Test
    void returnsAStableResultForTheSameInput() throws Exception {
        String first = mockMvc.perform(post("/api/v1/projects/{projectId}/analysis", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(analysisBody(9)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String second = mockMvc.perform(post("/api/v1/projects/{projectId}/analysis", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(analysisBody(9)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertThat(second).isEqualTo(first);
    }

    @Test
    void rejectsEmptyAndMoreThanFiftyAssetsWithStructuredErrors() throws Exception {
        mockMvc.perform(post("/api/v1/projects/{projectId}/analysis", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"assets\":[]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.fieldErrors").isMap());

        mockMvc.perform(post("/api/v1/projects/{projectId}/analysis", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(analysisBody(51)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void rejectsNullAssetElementsWithStructuredValidationError() throws Exception {
        mockMvc.perform(post("/api/v1/projects/{projectId}/analysis", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"assets\":[null]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").value("请求参数不符合要求"))
                .andExpect(jsonPath("$.fieldErrors").isMap());
    }

    @Test
    void mapsMalformedJsonInvalidEnumAndInvalidUuidToStructuredBadRequests() throws Exception {
        mockMvc.perform(post("/api/v1/projects/{projectId}/analysis", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"assets\":["))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"))
                .andExpect(jsonPath("$.fieldErrors").isMap());

        mockMvc.perform(post("/api/v1/projects")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scene\":\"SUNNY\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("MALFORMED_REQUEST"));

        mockMvc.perform(post("/api/v1/projects/not-a-uuid/analysis")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(analysisBody(1)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_PATH_PARAMETER"))
                .andExpect(jsonPath("$.fieldErrors").isMap());
    }

    @Test
    void countsOnlyAssetsUnusedByEveryRecommendationAsExcluded() throws Exception {
        mockMvc.perform(post("/api/v1/projects/{projectId}/analysis", projectId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(unionCoverageBody()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.excludedCount").value(0));
    }

    @Test
    void returnsStructuredNotFoundForUnknownProject() throws Exception {
        mockMvc.perform(post("/api/v1/projects/{projectId}/analysis", UUID.randomUUID())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(analysisBody(1)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROJECT_NOT_FOUND"))
                .andExpect(jsonPath("$.message").value("作品不存在或已失效"));
    }

    private static String analysisBody(int count) {
        String assets = IntStream.range(0, count)
                .mapToObj(index -> """
                        {"id":"asset-%d","name":"%d.jpg","mimeType":"image/jpeg","size":%d,"width":%d,"height":%d,"originalIndex":%d}
                        """.formatted(index, index, 100_000 + index, 1200 + index, 900 + index, index).trim())
                .collect(Collectors.joining(","));
        return "{\"assets\":[" + assets + "]}";
    }

    private static String unionCoverageBody() {
        String assets = IntStream.range(0, 12)
                .mapToObj(index -> {
                    boolean late = index >= 9;
                    int width = late ? 4000 : 2400;
                    int height = late ? 4000 : 400;
                    long size = late ? 8_000_000L + index : 100_000L + index;
                    return """
                            {"id":"asset-%d","name":"%d.jpg","mimeType":"image/jpeg","size":%d,"width":%d,"height":%d,"originalIndex":%d}
                            """.formatted(index, index, size, width, height, index).trim();
                })
                .collect(Collectors.joining(","));
        return "{\"assets\":[" + assets + "]}";
    }
}
