package newsbalance.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DebateRoomDto {
    private Long id;
    private String title;
    private String topic;
    private boolean active;
    private LocalDateTime createdAt;
    private String debaterA;
    private String debaterB;
    private boolean debaterAReady;
    private boolean debaterBReady;
    private boolean started;
    private List<String> keywords;
}