package newsbalance.demo.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class DebateRoomWithMessagesDto {
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
    private List<MessageDto> messages;
    private List<ChatMessageDto> chatMessages;
    private List<String> keywords;
    
    private int currentParticipants;
    private int totalVisits;
    private String creator;
    
    private String currentTurnUser;  // 현재 발언 차례인 사용자 닉네임
    
    public DebateRoomWithMessagesDto(
            Long id, String title, String topic, boolean active, 
            LocalDateTime createdAt, String debaterA, String debaterB, 
            boolean debaterAReady, boolean debaterBReady, boolean started,
            List<MessageDto> messages, List<ChatMessageDto> chatMessages, List<String> keywords,
            String currentTurnUser) {
        this.id = id;
        this.title = title;
        this.topic = topic;
        this.active = active;
        this.createdAt = createdAt;
        this.debaterA = debaterA;
        this.debaterB = debaterB;
        this.debaterAReady = debaterAReady;
        this.debaterBReady = debaterBReady;
        this.started = started;
        this.messages = messages;
        this.chatMessages = chatMessages;
        this.keywords = keywords;
        
        this.currentParticipants = 0;
        this.totalVisits = 0;
        this.creator = debaterA;
        this.currentTurnUser = currentTurnUser;
    }
}