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
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

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
    
    // 턴 타이머를 관리하는 맵 (룸ID -> 타이머 작업)
    private final Map<Long, ScheduledFuture<?>> turnTimers = new ConcurrentHashMap<>();
    
    // 토론 종료 요청을 관리하는 맵 (룸ID -> 요청자 닉네임)
    private final Map<Long, String> debateEndRequests = new ConcurrentHashMap<>();
    
    // 스케줄러 추가
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(10);
    
    // 턴 타임아웃 시간 (5분 = 300초)
    private static final long TURN_TIMEOUT_SECONDS = 300;

    public void handleMessage(Message message) {
        User sender = userRepository.findByNickname(message.getSender())
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다: " + message.getSender()));
        
        DebateRoom room = roomRepository.findById(message.getRoomId())
                .orElseThrow(() -> new EntityNotFoundException("토론방을 찾을 수 없습니다: " + message.getRoomId()));

        switch (message.getType()) {
            case "CHAT", "DEBATE" -> handleChat(sender, room, message);
            case "READY" -> handleReady(sender, room);
            case "FORFEIT", "EXIT", "ACK" -> endDebate(message, room);
            case "DEBATE_END_REQUEST" -> handleDebateEndRequest(sender, room, message);
            case "DEBATE_END_ACCEPT" -> handleDebateEndAccept(sender, room, message);
            case "DEBATE_END_REJECT" -> handleDebateEndReject(sender, room, message);
            default -> {
                // 알 수 없는 메시지 타입 로깅
                System.out.println("알 수 없는 메시지 타입: " + message.getType());
            }
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

        // 메시지가 수신되면 기존 타이머를 취소합니다
        cancelTurnTimer(room.getId());

        // 메시지 저장 - 타입 하드코딩 대신 메시지 타입 사용
        DebateMessage debateMessage = DebateMessage.builder()
                .type(message.getType())  // 원본 메시지 타입 사용
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
        String summary = ""; // 요약 스텁
        
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
        
        // 새로운 턴에 대한 타이머 시작
        startTurnTimer(room.getId());
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

    // 토론이 시작될 때 타이머 시작
    @Transactional
    public void startDebate(Long roomId) {
        DebateRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new EntityNotFoundException("토론방을 찾을 수 없습니다: " + roomId));
        
        if (!room.isStarted()) {
            room.setStarted(true);
            roomRepository.save(room);
            
            // 토론 시작 메시지 전송
            messagingTemplate.convertAndSend("/topic/room/" + roomId, 
                    new Message("SYSTEM", "토론이 시작되었습니다.", "System", roomId));
            
            // 첫 턴에 대한 타이머 시작
            startTurnTimer(roomId);
        }
    }
    
    // 턴 타이머 시작
    private void startTurnTimer(Long roomId) {
        // 기존 타이머가 있으면 취소
        cancelTurnTimer(roomId);
        
        // 새 타이머 시작
        ScheduledFuture<?> timerTask = scheduler.schedule(() -> {
            try {
                handleTurnTimeout(roomId);
            } catch (Exception e) {
                System.err.println("턴 타임아웃 처리 중 오류: " + e.getMessage());
                e.printStackTrace();
            }
        }, TURN_TIMEOUT_SECONDS, TimeUnit.SECONDS);
        
        turnTimers.put(roomId, timerTask);
        System.out.println("토론방 " + roomId + "의 턴 타이머 시작 (" + TURN_TIMEOUT_SECONDS + "초)");
    }
    
    // 턴 타이머 취소
    private void cancelTurnTimer(Long roomId) {
        ScheduledFuture<?> timerTask = turnTimers.remove(roomId);
        if (timerTask != null && !timerTask.isDone()) {
            timerTask.cancel(false);
            System.out.println("토론방 " + roomId + "의 턴 타이머 취소됨");
        }
    }
    
    // 턴 타임아웃 처리
    @Transactional
    public void handleTurnTimeout(Long roomId) {
        DebateRoom room = roomRepository.findById(roomId)
                .orElseThrow(() -> new EntityNotFoundException("토론방을 찾을 수 없습니다: " + roomId));
        
        if (!room.isStarted()) {
            return; // 토론이 시작되지 않았으면 무시
        }
        
        // 현재 턴 사용자 찾기
        User currentUser = userRepository.findById(room.getCurrentTurnUserId())
                .orElseThrow(() -> new EntityNotFoundException("현재 턴 사용자를 찾을 수 없습니다"));
        
        // 시스템 메시지 저장
        DebateMessage timeoutMessage = DebateMessage.builder()
                .type("SYSTEM")
                .content(currentUser.getNickname() + "님이 5분 동안 응답이 없어 턴이 넘어갑니다.")
                .sender("System")
                .debateRoom(room)
                .createdAt(LocalDateTime.now())
                .build();
        
        messageRepository.save(timeoutMessage);
        
        // 시스템 메시지 전송
        messagingTemplate.convertAndSend("/topic/room/" + roomId, 
                new Message("SYSTEM", currentUser.getNickname() + "님이 5분 동안 응답이 없어 턴이 넘어갑니다.", "System", roomId));
        
        // 턴 변경
        if (room.getCurrentTurnUserId().equals(room.getDebaterA().getId())) {
            room.setCurrentTurnUserId(room.getDebaterB().getId());
        } else {
            room.setCurrentTurnUserId(room.getDebaterA().getId());
        }
        roomRepository.save(room);
        
        // 턴 변경 알림
        String nextUser = room.getCurrentTurnUserId().equals(room.getDebaterA().getId()) 
                ? room.getDebaterA().getNickname() : room.getDebaterB().getNickname();
        messagingTemplate.convertAndSend("/topic/turn/" + roomId, 
                new Message("TURN", nextUser, "System", roomId));
        
        // 새 턴에 대한 타이머 시작
        startTurnTimer(roomId);
    }
    
    // 토론 종료 요청 처리
    @Transactional
    private void handleDebateEndRequest(User sender, DebateRoom room, Message message) {
        // 토론이 시작되지 않았으면 종료 요청 불가
        if (!room.isStarted()) {
            messagingTemplate.convertAndSend("/topic/error/" + room.getId(), 
                    new Message("ERROR", "토론이 시작되지 않아 종료 요청을 할 수 없습니다.", "System", room.getId()));
            return;
        }
        
        // 토론자가 아니면 종료 요청 불가
        if (!isDebater(sender, room)) {
            messagingTemplate.convertAndSend("/topic/error/" + room.getId(), 
                    new Message("ERROR", "토론자만 토론 종료를 요청할 수 있습니다.", "System", room.getId()));
            return;
        }
        
        // 이미 종료 요청이 있는지 확인
        if (debateEndRequests.containsKey(room.getId())) {
            messagingTemplate.convertAndSend("/topic/error/" + room.getId(), 
                    new Message("ERROR", "이미 토론 종료 요청이 진행 중입니다.", "System", room.getId()));
            return;
        }
        
        // 종료 요청 저장
        debateEndRequests.put(room.getId(), sender.getNickname());
        
        // 종료 요청 메시지 저장
        DebateMessage requestMessage = DebateMessage.builder()
                .type("SYSTEM")
                .content(sender.getNickname() + "님이 토론 종료를 요청했습니다.")
                .sender("System")
                .debateRoom(room)
                .createdAt(LocalDateTime.now())
                .build();
        messageRepository.save(requestMessage);
        
        // 모든 참여자에게 종료 요청 알림
        messagingTemplate.convertAndSend("/topic/room/" + room.getId(), 
                new Message("DEBATE_END_REQUEST", message.getContent(), sender.getNickname(), room.getId()));
                
        System.out.println("토론 종료 요청 - 방: " + room.getId() + ", 요청자: " + sender.getNickname());
    }
    
    // 토론 종료 수락 처리
    @Transactional
    private void handleDebateEndAccept(User sender, DebateRoom room, Message message) {
        // 종료 요청이 있는지 확인
        String requester = debateEndRequests.get(room.getId());
        if (requester == null) {
            messagingTemplate.convertAndSend("/topic/error/" + room.getId(), 
                    new Message("ERROR", "토론 종료 요청이 없습니다.", "System", room.getId()));
            return;
        }
        
        // 토론자가 아니면 수락 불가
        if (!isDebater(sender, room)) {
            messagingTemplate.convertAndSend("/topic/error/" + room.getId(), 
                    new Message("ERROR", "토론자만 토론 종료를 수락할 수 있습니다.", "System", room.getId()));
            return;
        }
        
        // 요청자 본인이 수락하는 경우 방지
        if (requester.equals(sender.getNickname())) {
            messagingTemplate.convertAndSend("/topic/error/" + room.getId(), 
                    new Message("ERROR", "본인이 요청한 종료를 수락할 수 없습니다.", "System", room.getId()));
            return;
        }
        
        // 토론 종료 처리
        room.setStarted(false);
        room.setDebaterAReady(false);
        room.setDebaterBReady(false);
        roomRepository.save(room);
        
        // 종료 요청 제거
        debateEndRequests.remove(room.getId());
        
        // 턴 타이머 정리
        cancelTurnTimer(room.getId());
        
        // 종료 수락 메시지 저장
        DebateMessage acceptMessage = DebateMessage.builder()
                .type("SYSTEM")
                .content(sender.getNickname() + "님이 토론 종료를 수락했습니다. 토론이 종료됩니다.")
                .sender("System")
                .debateRoom(room)
                .createdAt(LocalDateTime.now())
                .build();
        messageRepository.save(acceptMessage);
        
        // 모든 참여자에게 종료 수락 알림
        messagingTemplate.convertAndSend("/topic/room/" + room.getId(), 
                new Message("DEBATE_END_ACCEPT", message.getContent(), sender.getNickname(), room.getId()));
        
        // 방 상태 업데이트 전송 (토론 종료 상태)
        messagingTemplate.convertAndSend("/topic/room/" + room.getId() + "/status", 
                Map.of("started", false, "ended", true));
                
        System.out.println("토론 종료 수락 - 방: " + room.getId() + ", 수락자: " + sender.getNickname());
    }
    
    // 토론 종료 거절 처리
    @Transactional
    private void handleDebateEndReject(User sender, DebateRoom room, Message message) {
        // 종료 요청이 있는지 확인
        String requester = debateEndRequests.get(room.getId());
        if (requester == null) {
            messagingTemplate.convertAndSend("/topic/error/" + room.getId(), 
                    new Message("ERROR", "토론 종료 요청이 없습니다.", "System", room.getId()));
            return;
        }
        
        // 토론자가 아니면 거절 불가
        if (!isDebater(sender, room)) {
            messagingTemplate.convertAndSend("/topic/error/" + room.getId(), 
                    new Message("ERROR", "토론자만 토론 종료를 거절할 수 있습니다.", "System", room.getId()));
            return;
        }
        
        // 요청자 본인이 거절하는 경우 방지
        if (requester.equals(sender.getNickname())) {
            messagingTemplate.convertAndSend("/topic/error/" + room.getId(), 
                    new Message("ERROR", "본인이 요청한 종료를 거절할 수 없습니다.", "System", room.getId()));
            return;
        }
        
        // 종료 요청 제거
        debateEndRequests.remove(room.getId());
        
        // 종료 거절 메시지 저장
        DebateMessage rejectMessage = DebateMessage.builder()
                .type("SYSTEM")
                .content(sender.getNickname() + "님이 토론 종료를 거절했습니다.")
                .sender("System")
                .debateRoom(room)
                .createdAt(LocalDateTime.now())
                .build();
        messageRepository.save(rejectMessage);
        
        // 모든 참여자에게 종료 거절 알림
        messagingTemplate.convertAndSend("/topic/room/" + room.getId(), 
                new Message("DEBATE_END_REJECT", message.getContent(), sender.getNickname(), room.getId()));
                
        System.out.println("토론 종료 거절 - 방: " + room.getId() + ", 거절자: " + sender.getNickname());
    }
    
    // 사용자가 토론자인지 확인하는 헬퍼 메서드
    private boolean isDebater(User user, DebateRoom room) {
        return (room.getDebaterA() != null && room.getDebaterA().getId().equals(user.getId())) ||
               (room.getDebaterB() != null && room.getDebaterB().getId().equals(user.getId()));
    }
    
    // 토론방 삭제 또는 종료 시 타이머 및 요청 정리
    public void cleanupRoomTimers(Long roomId) {
        cancelTurnTimer(roomId);
        debateEndRequests.remove(roomId);
    }
}