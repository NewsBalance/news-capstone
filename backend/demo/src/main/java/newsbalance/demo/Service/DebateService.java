package newsbalance.demo.Service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import newsbalance.demo.Entity.DebateMessage;
import newsbalance.demo.Entity.DebateRoom;
import newsbalance.demo.Entity.Message;
import newsbalance.demo.Entity.User;
import newsbalance.demo.Repository.ChatMessageRepository;
import newsbalance.demo.Repository.DebateMessageRepository;
import newsbalance.demo.Repository.DebateRoomRepository;
import newsbalance.demo.Repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class DebateService {
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final DebateRoomRepository roomRepository;
    private final DebateMessageRepository messageRepository;
    private final ChatMessageRepository chatMessageRepository;

    public void handleMessage(Message message) {
        User sender = userRepository.findByNickname(message.getSender())
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다: " + message.getSender()));
        
        DebateRoom room = roomRepository.findById(message.getRoomId())
                .orElseThrow(() -> new EntityNotFoundException("토론방을 찾을 수 없습니다: " + message.getRoomId()));

        switch (message.getType()) {
            case "CHAT" -> handleChat(sender, room, message);
            case "READY" -> handleReady(sender, room);
            case "FORFEIT", "EXIT", "ACK" -> endDebate(message, room);
        }
    }

    @Transactional
    private void handleChat(User sender, DebateRoom room, Message message) {
        if (!room.isStarted()) {
            // 아직 시작 안됨 - 오류 메시지 전송
            messagingTemplate.convertAndSend("/topic/error/" + room.getId(), 
                    new Message("ERROR", "토론이 아직 시작되지 않았습니다.", "System", room.getId()));
            return;
        }
        
        if (!sender.getId().equals(room.getCurrentTurnUserId())) {
            // 턴이 아님 - 오류 메시지 전송
            messagingTemplate.convertAndSend("/topic/error/" + room.getId(), 
                    new Message("ERROR", "현재 발언 차례가 아닙니다.", "System", room.getId()));
            return;
        }

        // 메시지 저장
        DebateMessage debateMessage = DebateMessage.builder()
                .type("CHAT")
                .content(message.getContent())
                .sender(message.getSender())
                .debateRoom(room)
                .user(sender)
                .createdAt(LocalDateTime.now())
                .build();
        
        messageRepository.save(debateMessage);

        // 메시지 전송
        messagingTemplate.convertAndSend("/topic/room/" + room.getId(), message);

        // AI 요약기능 연동 (임시 스텁)
        String summary = "[AI 요약] " + message.getContent(); // 요약 스텁
        
        // 요약 내용 저장
        debateMessage.setSummary(summary);
        messageRepository.save(debateMessage);
        
        // 요약 메시지 전송
        messagingTemplate.convertAndSend("/topic/summary/" + room.getId(), 
                new Message("SUMMARY", summary, "AI", room.getId()));

        // 턴 변경
        if (sender.getId().equals(room.getDebaterA().getId())) {
            room.setCurrentTurnUserId(room.getDebaterB().getId());
        } else {
            room.setCurrentTurnUserId(room.getDebaterA().getId());
        }
        roomRepository.save(room);
        
        // 턴 변경 알림
        String nextUser = room.getCurrentTurnUserId().equals(room.getDebaterA().getId()) 
                ? room.getDebaterA().getNickname() : room.getDebaterB().getNickname();
        messagingTemplate.convertAndSend("/topic/turn/" + room.getId(), 
                new Message("TURN", nextUser, "System", room.getId()));
    }

    @Transactional
    private void handleReady(User sender, DebateRoom room) {
        boolean statusChanged = false;
        
        if (sender.getId().equals(room.getDebaterA().getId()) && !room.isDebaterAReady()) {
            room.setDebaterAReady(true);
            statusChanged = true;
        } else if (sender.getId().equals(room.getDebaterB().getId()) && !room.isDebaterBReady()) {
            room.setDebaterBReady(true);
            statusChanged = true;
        }

        // 준비 상태 알림
        if (statusChanged) {
            messagingTemplate.convertAndSend("/topic/room/" + room.getId(), 
                    new Message("READY", sender.getNickname() + "님이 준비를 완료했습니다.", "System", room.getId()));
        }

        // 양쪽 모두 준비 완료되면 토론 시작
        if (room.isDebaterAReady() && room.isDebaterBReady() && !room.isStarted()) {
            room.setStarted(true);
            room.setCurrentTurnUserId(room.getDebaterA().getId()); // A가 선턴
            
            // 시스템 메시지 추가 및 전송
            messagingTemplate.convertAndSend("/topic/room/" + room.getId(), 
                    new Message("START", "토론이 시작되었습니다. " + room.getDebaterA().getNickname() + "님부터 시작합니다.", "System", room.getId()));
                    
            // 시스템 메시지 저장
            DebateMessage startMessage = DebateMessage.builder()
                    .type("INFO")
                    .content("토론이 시작되었습니다")
                    .sender("System")
                    .debateRoom(room)
                    .createdAt(LocalDateTime.now())
                    .build();
            messageRepository.save(startMessage);
        }
        
        roomRepository.save(room);
    }

    @Transactional
    private void endDebate(Message message, DebateRoom room) {
        String reason;
        
        switch (message.getType()) {
            case "FORFEIT" -> reason = message.getSender() + "님이 기권했습니다.";
            case "EXIT" -> reason = message.getSender() + "님이 토론방을 나갔습니다.";
            case "ACK" -> reason = "토론이 종료되었습니다.";
            default -> reason = "알 수 없는 이유로 토론이 종료되었습니다.";
        }
        
        room.setActive(false);
        room.setStarted(false);
        roomRepository.save(room);
        
        // 종료 메시지 전송
        messagingTemplate.convertAndSend("/topic/room/" + room.getId(), 
                new Message("END", reason, "System", room.getId()));
                
        // 종료 메시지 저장
        DebateMessage endMessage = DebateMessage.builder()
                .type("END")
                .content(reason)
                .sender("System")
                .debateRoom(room)
                .createdAt(LocalDateTime.now())
                .build();
        messageRepository.save(endMessage);
    }

    @Transactional
    public void handleChatMessage(Message message) {
        DebateRoom room = roomRepository.findById(message.getRoomId())
                .orElseThrow(() -> new EntityNotFoundException("토론방을 찾을 수 없습니다: " + message.getRoomId()));
        
        User user = userRepository.findByNickname(message.getSender())
                .orElse(null);
        
        // ChatMessage 엔티티에 저장
        if (user != null) {
            newsbalance.demo.Entity.ChatMessage chatMessage = newsbalance.demo.Entity.ChatMessage.builder()
                    .message(message.getSender() + ": " + message.getContent())
                    .debateRoom(room)
                    .user(user)
                    .createdAt(LocalDateTime.now())
                    .build();
            
            chatMessageRepository.save(chatMessage);
        }
        
        // 실시간 전송
        messagingTemplate.convertAndSend("/topic/chat/" + room.getId(), message);
    }
}