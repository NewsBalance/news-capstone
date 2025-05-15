package newsbalance.demo.debate.service;

import lombok.RequiredArgsConstructor;
import newsbalance.demo.debate.entity.DebateRoom;
import newsbalance.demo.debate.entity.Message;
import newsbalance.demo.debate.entity.User;
import newsbalance.demo.debate.repository.DebateRoomRepository;
import newsbalance.demo.debate.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DebateService {
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final DebateRoomRepository roomRepository;

    public void handleMessage(Message message) {
        User sender = userRepository.findByUsername(message.getSender()).orElseThrow();
        DebateRoom room = roomRepository.findById(message.getRoomId()).orElseThrow();

        switch (message.getType()) {
            case "CHAT" -> handleChat(sender, room, message);
            case "READY" -> handleReady(sender, room);
            case "FORFEIT", "EXIT", "ACK" -> endDebate(message, room);
        }
    }

    private void handleChat(User sender, DebateRoom room, Message message) {
        if (!room.isStarted()) return; // 아직 시작 안됨
        if (!sender.getId().equals(room.getCurrentTurnUserId())) return; // 턴이 아님

        // TODO: AI 요약기능 연동 필요
        String summary = "[AI 요약] " + message.getContent(); // 요약 스텁

        messagingTemplate.convertAndSend("/topic/room/" + room.getId(), message);
        messagingTemplate.convertAndSend("/topic/summary/" + room.getId(), new Message("SUMMARY", summary, "AI", room.getId()));

        // 턴 변경
        if (sender.equals(room.getDebaterA())) {
            room.setCurrentTurnUserId(room.getDebaterB().getId());
        } else {
            room.setCurrentTurnUserId(room.getDebaterA().getId());
        }
        roomRepository.save(room);
    }

    private void handleReady(User sender, DebateRoom room) {
        if (sender.equals(room.getDebaterA())) {
            room.setDebaterAReady(true);
        } else if (sender.equals(room.getDebaterB())) {
            room.setDebaterBReady(true);
        }

        if (room.isDebaterAReady() && room.isDebaterBReady()) {
            room.setStarted(true);
            room.setCurrentTurnUserId(room.getDebaterA().getId()); // A가 선턴
            messagingTemplate.convertAndSend("/topic/room/" + room.getId(), new Message("INFO", "Debate started", "System", room.getId()));
        }
        roomRepository.save(room);
    }

    private void endDebate(Message message, DebateRoom room) {
        room.setActive(false);
        room.setStarted(false);
        roomRepository.save(room);
        messagingTemplate.convertAndSend("/topic/room/" + room.getId(), new Message("END", message.getType() + " by " + message.getSender(), "System", room.getId()));
    }
}