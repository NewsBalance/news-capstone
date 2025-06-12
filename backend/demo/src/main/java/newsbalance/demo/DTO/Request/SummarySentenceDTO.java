package newsbalance.demo.DTO.Request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class SummarySentenceDTO {
    private String content;
    private Double score;
}
