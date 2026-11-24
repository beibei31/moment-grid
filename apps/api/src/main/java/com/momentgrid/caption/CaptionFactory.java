package com.momentgrid.caption;

import com.momentgrid.api.ApiDtos.CaptionCandidate;
import com.momentgrid.api.ApiDtos.Scene;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CaptionFactory {

    public List<CaptionCandidate> create(Scene scene) {
        String sceneLead = switch (scene) {
            case TRAVEL -> "这一路值得被好好记住。";
            case FOOD -> "这一餐，留在照片里慢慢回味。";
            case PARTY -> "这次相聚，值得留下一组照片。";
            case FAMILY -> "平常日子，因为在一起而有了光。";
            case PET -> "镜头里的小家伙，又承包了今天的好心情。";
            case CUSTOM, DAILY -> "把想留下来的片刻，认真收进这一组照片。";
        };

        return List.of(
                new CaptionCandidate("minimal", "MINIMAL", "今天，也值得好好记住。", "短句留白，适合作为轻量记录"),
                new CaptionCandidate("natural", "NATURAL", sceneLead, "自然口语，不补写地点和人物关系"),
                new CaptionCandidate("story", "STORY", "把这些照片排在一起，片刻有了前后，也有了自己的节奏。回头再看，仍然值得好好记住。", "用两句话形成轻量叙事"),
                new CaptionCandidate("humor", "HUMOR", "发朋友圈的最高礼仪：每一张都不是来凑数的。", "轻松但不过度网络化"),
                new CaptionCandidate("poetic", "POETIC", "片刻被收进画面，回看时仍有自己的节奏。", "克制诗意，不补写具体天气或地点"),
                new CaptionCandidate("informational", "INFORMATIONAL", "本组记录：一些想留下来的照片。", "结构清晰，适合作为记录说明")
        );
    }
}
