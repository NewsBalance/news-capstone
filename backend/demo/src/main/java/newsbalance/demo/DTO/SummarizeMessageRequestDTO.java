package newsbalance.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SummarizeMessageRequestDTO {
    private Long roomId;
    private List<clientMessageDTO> messages;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class clientMessageDTO{
        private String speaker;
        private String text;
    }
}
