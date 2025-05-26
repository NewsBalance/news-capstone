package newsbalance.demo.DTO.Request;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class YoutubeContentRequestDTO {
    private String url;
    private Double biasScore;
    private List<SummarySentenceDTO> summarySentences;
}
