package newsbalance.demo.Entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Message {
    private String type; // CHAT, JOIN, READY, FORFEIT, EXIT, ACK
    private String content;
    private String sender;
    private Long roomId;
}