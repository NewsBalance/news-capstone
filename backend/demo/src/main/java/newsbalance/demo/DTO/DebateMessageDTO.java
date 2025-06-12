package newsbalance.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DebateMessageDTO {
    private Long id;
    private String speaker;
    private String text;
    private String summary;
    private String factCheck;
    private String factCheckBy;
    private Long debateRoomId;
    private boolean isSystemMessage;
} 