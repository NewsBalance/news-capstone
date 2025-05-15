package newsbalance.demo.debate.controller;

import lombok.RequiredArgsConstructor;
import newsbalance.demo.debate.entity.Message;
import newsbalance.demo.debate.service.DebateService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class WebSocketController {
    private final DebateService debateService;

    @MessageMapping("/chat")
    public void receiveMessage(@Payload Message message) {
        debateService.handleMessage(message);
    }
}