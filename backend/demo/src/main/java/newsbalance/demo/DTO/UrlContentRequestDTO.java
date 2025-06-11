package newsbalance.demo.DTO;

import lombok.Getter;
import lombok.Setter;
import newsbalance.demo.DTO.Request.RelatedArticleDTO;
import newsbalance.demo.DTO.Request.SummarySentenceDTO;

import java.util.List;

@Getter
@Setter
public class UrlContentRequestDTO {
    private String url;
    private String title;
    private Double biasScore;
    private List<RelatedArticleDTO> relatedArticles;
    private List<SummarySentenceDTO> summarySentences;
    private List<String> keywords;
}
