package newsbalance.demo.Controller;

import lombok.RequiredArgsConstructor;
import newsbalance.demo.Entity.Message;
import newsbalance.demo.Service.DebateService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class WebSocketController {
    private final DebateService debateService;

    @MessageMapping("/debate")
    public void handleDebateMessage(@Payload Message message) {
        debateService.handleMessage(message);
    }
    
    @MessageMapping("/chat")
    public void handleChatMessage(@Payload Message message) {
        // 관전자 채팅은 바로 브로드캐스트
        debateService.handleChatMessage(message);
    }
}