package newsbalance.demo.DTO.Request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class YoutubeContentRequestDTO {
    private String url;
    private Double biasScore;
    private List<RelatedArticleDTO> relatedArticles;
    private List<SummarySentenceDTO> summarySentences;
    private List<String> keywords;
}
