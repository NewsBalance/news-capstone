package newsbalance.demo.Service;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import newsbalance.demo.DTO.DebateRoomDto;
import newsbalance.demo.Entity.DebateMessage;
import newsbalance.demo.Entity.DebateRoom;
import newsbalance.demo.Entity.Message;
import newsbalance.demo.Entity.RoomParticipant;
import newsbalance.demo.Entity.User;
import newsbalance.demo.Repository.JPA.ChatMessageRepository;
import newsbalance.demo.Repository.JPA.DebateMessageRepository;
import newsbalance.demo.Repository.JPA.DebateRoomRepository;
import newsbalance.demo.Repository.JPA.RoomParticipantRepository;
import newsbalance.demo.Repository.JPA.UserRepository;
import newsbalance.demo.Configuration.SessionConst;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DebateService {
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;
    private final DebateRoomRepository roomRepository;
    private final DebateMessageRepository messageRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final DebateRoomService debateRoomService;
    private final RoomParticipantRepository roomParticipantRepository;

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
        
        // 1. 로그 추가
        System.out.println("WebSocket Chat 메시지 처리: " + message.getContent() + " 보낸이: " + message.getSender());
        
        // 2. ChatMessage 엔티티에 저장 및 WebSocket 전송
        if (user != null) {
            // 이미 존재하는 메시지인지 확인
            String fullMessage = message.getSender() + ": " + message.getContent();
            boolean messageExists = chatMessageRepository.existsByMessageAndDebateRoomIdAndUserIdAndCreatedAtBetween(
                    fullMessage,
                    room.getId(),
                    user.getId(),
                    LocalDateTime.now().minusSeconds(3),
                    LocalDateTime.now());
            
            if (!messageExists) {
                try {
                    newsbalance.demo.Entity.ChatMessage chatMessage = newsbalance.demo.Entity.ChatMessage.builder()
                            .message(fullMessage)
                            .debateRoom(room)
                            .user(user)
                            .createdAt(LocalDateTime.now())
                            .build();
                    
                    chatMessageRepository.save(chatMessage);    
                    
                    // 저장 성공 시에만 WebSocket으로 전송
                    messagingTemplate.convertAndSend("/topic/chat/" + room.getId(), message);
                } catch (Exception e) {
                    System.err.println("채팅 메시지 처리 중 오류 발생: " + e.getMessage());
                }
            } else {
                System.out.println("중복 메시지 감지됨: " + fullMessage);
            }
        }
    }

    public void handleDebaterBLeave(Long roomId, String nickname) {
        // 토론방 정보 가져오기
        DebateRoomDto room = debateRoomService.leaveRoom(roomId, nickname);
        
        if (room.isStarted()) {
            // 토론 종료 메시지 전송
            messagingTemplate.convertAndSend("/topic/room/" + roomId, 
                new Message("SYSTEM", 
                    String.format("토론자B: %s님이 나가셨습니다. 토론이 종료됩니다. 3분 후 방이 삭제됩니다.", nickname),
                    "System",
                    roomId));
            
            // 토론 종료 메시지 추가
            messagingTemplate.convertAndSend("/topic/room/" + roomId, 
                new Message("INFO", 
                    "토론이 종료되었습니다.",
                    "System",
                    roomId));
        }
    }

    @Transactional
    public void enterDebateRoom(Long roomId, HttpServletRequest request) {
        // 세션에서 사용자 정보 가져오기
        HttpSession session = request.getSession(false);
        if (session == null) {
            throw new IllegalStateException("로그인이 필요합니다.");
        }

        String nickname = (String) session.getAttribute(SessionConst.Login_nickname);
        if (nickname == null) {
            throw new IllegalStateException("세션에 사용자 정보가 없습니다.");
        }

        // 사용자 정보 조회
        User user = userRepository.findByNickname(nickname)
            .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다: " + nickname));

        // 토론방 정보 조회
        DebateRoom room = roomRepository.findById(roomId)
            .orElseThrow(() -> new EntityNotFoundException("토론방을 찾을 수 없습니다: " + roomId));

        // 중복 입장 체크
        Optional<RoomParticipant> existingParticipant = roomParticipantRepository
            .findByUserIdAndRoomId(user.getId(), roomId);

        if (existingParticipant.isPresent()) {
            RoomParticipant participant = existingParticipant.get();
            // 이미 활성 상태라면 아무 작업도 하지 않음
            if (participant.isActive()) {
                return;
            }
            // 비활성 상태라면 활성화
            participant.setActive(true);
            participant.setEnteredAt(LocalDateTime.now());
            participant.setExitedAt(null);
            roomParticipantRepository.save(participant);
        } else {
            // 새 참가자 등록
            RoomParticipant participant = new RoomParticipant();
            participant.setUser(user);
            participant.setRoom(room);
            participant.setEnteredAt(LocalDateTime.now());
            participant.setActive(true);
            roomParticipantRepository.save(participant);
        }

        // 현재 참여자 수 업데이트
        long activeParticipants = roomParticipantRepository.countByRoomIdAndIsActiveTrue(roomId);
        room.setCurrentParticipants((int)activeParticipants);
        roomRepository.save(room);

        // 방 입장 알림 전송 (선택적)
        // ...
    }

    @Transactional
    public void leaveDebateRoom(Long roomId, HttpServletRequest request) {
        // 세션에서 사용자 정보 가져오기
        HttpSession session = request.getSession(false);
        if (session == null) {
            return;
        }

        String nickname = (String) session.getAttribute(SessionConst.Login_nickname);

        if (nickname == null) {
            return;
        }

        // 사용자 정보 조회
        User user = userRepository.findByNickname(nickname).orElse(null);
        if (user == null) {
            return;
        }

        // 참여자 기록 조회
        Optional<RoomParticipant> participantOpt =
            roomParticipantRepository.findByUserIdAndRoomId(user.getId(), roomId);

        if (!participantOpt.isPresent() || !participantOpt.get().isActive()) {
            return; // 참여자가 없거나 이미 비활성 상태
        }

        // 참여자 상태 업데이트
        RoomParticipant participant = participantOpt.get();
        participant.setActive(false);
        participant.setExitedAt(LocalDateTime.now());
        roomParticipantRepository.save(participant);

        // 토론방 정보 조회 및 업데이트
        DebateRoom room = roomRepository.findById(roomId).orElse(null);
        if (room != null) {
            // 현재 참여자 수 업데이트
            long activeParticipants = roomParticipantRepository.countByRoomIdAndIsActiveTrue(roomId);
            room.setCurrentParticipants((int)activeParticipants);
            roomRepository.save(room);
        }

        // 방 퇴장 알림 전송 (선택적)
        // ...
    }
}