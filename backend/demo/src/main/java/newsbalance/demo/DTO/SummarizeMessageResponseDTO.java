package newsbalance.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import newsbalance.demo.DTO.Request.RelatedArticleDTO;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SummarizeMessageResponseDTO {
    private Long roomId;
    private String summarizemessage;
    private List<RelatedArticleDTO> relatedArticles;
    private List<String> keywords;
}
