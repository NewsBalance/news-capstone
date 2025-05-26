package newsbalance.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class DebateRoomDto {
    private Long id;
    private String title;
    private String topic;
    private boolean active;
    private String createdAt;
    private String debaterA;
    private String debaterB;
    private boolean debaterAReady;
    private boolean debaterBReady;
    private boolean started;
    private List<String> keywords;
    private int currentParticipants;
    private int totalVisits;
    private String creator;
}