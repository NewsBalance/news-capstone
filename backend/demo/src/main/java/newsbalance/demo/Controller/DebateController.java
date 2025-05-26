package newsbalance.demo.Controller;

import newsbalance.demo.DTO.ChatMessageRequestDto;
import newsbalance.demo.DTO.ChatMessagesDto;
import newsbalance.demo.DTO.CreateRoomRequestDto;
import newsbalance.demo.DTO.DebateRoomDto;
import newsbalance.demo.DTO.DebateRoomWithMessagesDto;
import newsbalance.demo.DTO.MessageDto;
import newsbalance.demo.DTO.MessageRequestDto;
import newsbalance.demo.DTO.UserInfoDto;
import newsbalance.demo.Service.DebateRoomService;
import newsbalance.demo.Service.UserService;
import newsbalance.demo.Service.DebateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import lombok.Getter;
import lombok.Setter;
import lombok.AllArgsConstructor;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class DebateController {

    @Autowired
    private DebateRoomService debateRoomService;

    @Autowired
    private UserService userService;

    @Autowired
    private SimpMessagingTemplate template;

    @Autowired
    private DebateService debateService;

    // Message 클래스 정의 (이미 있다면 import만 추가)
    @Getter
    @Setter
    @AllArgsConstructor
    public static class Message {
        private String type;
        private String content;
        private String sender;
        private Long roomId;
    }

    // 사용자 정보 조회 
    @GetMapping("/user/info")
    public ResponseEntity<UserInfoDto> getUserInfo() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal().toString())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        // Principal에서 nickname 추출
        String nickname = extractNickname(auth);
        UserInfoDto userInfo = userService.getUserInfo(nickname);
        return ResponseEntity.ok(userInfo);
    }

    // 토론방 목록 조회
    @GetMapping("/debate-rooms")
    public ResponseEntity<List<DebateRoomDto>> getAllDebateRooms() {
        List<DebateRoomDto> rooms = debateRoomService.getAllDebateRooms();
        return ResponseEntity.ok(rooms);
    }

    // 토론방 생성
    @PostMapping("/debate-rooms")
    public ResponseEntity<DebateRoomDto> createDebateRoom(@RequestBody CreateRoomRequestDto request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String nickname = extractNickname(auth);
        
        DebateRoomDto createdRoom = debateRoomService.createDebateRoom(request, nickname);
        return ResponseEntity.ok(createdRoom);  // DTO에 id가 포함되어 있어야 함
    }

    // 특정 토론방 조회
    @GetMapping("/debate-rooms/{roomId}")
    public ResponseEntity<DebateRoomWithMessagesDto> getDebateRoom(@PathVariable Long roomId) {
        DebateRoomWithMessagesDto room = debateRoomService.getDebateRoomWithMessages(roomId);
        return ResponseEntity.ok(room);
    }

    // 토론 메시지 전송
    @PostMapping("/debate-rooms/{roomId}/message")
    public ResponseEntity<MessageDto> sendMessage(
            @PathVariable Long roomId,
            @RequestBody MessageRequestDto messageRequest) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal().toString())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String nickname = extractNickname(auth);
        MessageDto savedMessage = debateRoomService.saveMessage(roomId, messageRequest, nickname);
        return ResponseEntity.ok(savedMessage);
    }

    // 채팅 메시지 조회
    @GetMapping("/debate-rooms/{roomId}/chat")
    public ResponseEntity<ChatMessagesDto> getChatMessages(@PathVariable Long roomId) {
        List<String> messages = debateRoomService.getChatMessages(roomId);
        return ResponseEntity.ok(new ChatMessagesDto(messages));
    }

    // 채팅 메시지 전송
    @PostMapping("/debate-rooms/{roomId}/chat")
    public ResponseEntity<Void> sendChatMessage(
            @PathVariable Long roomId,
            @RequestBody ChatMessageRequestDto chatRequest) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal().toString())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String nickname = extractNickname(auth);
        debateRoomService.saveChatMessage(roomId, chatRequest.getMessage(), nickname);
        return ResponseEntity.ok().build();
    }
    
    // 토론방 참가 엔드포인트 
    @PostMapping("/debate-rooms/{roomId}/join")
    public ResponseEntity<DebateRoomDto> joinDebateRoom(@PathVariable Long roomId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String nickname = extractNickname(auth);
        
        DebateRoomDto room = debateRoomService.joinRoom(roomId, nickname);
        
        // 토론자B로 참여한 경우에만 입장 메시지 전송
        if (room.getDebaterB() != null && room.getDebaterB().equals(nickname)) {
            template.convertAndSend("/topic/room/" + roomId,
                new Message("SYSTEM", nickname + "님이 토론자로 입장하셨습니다.", nickname, roomId));
        }
        
        return ResponseEntity.ok(room);
    }
    
    // 준비 상태 변경 엔드포인트 
    @PostMapping("/debate-rooms/{roomId}/ready")
    public ResponseEntity<DebateRoomDto> toggleReady(@PathVariable Long roomId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String nickname = extractNickname(auth);
        
        DebateRoomDto room = debateRoomService.toggleReady(roomId, nickname);
        
        // WebSocket을 통해 상태 변경 알림
        template.convertAndSend("/topic/room/" + roomId + "/status", room);
        
        return ResponseEntity.ok(room);
    }
    
    // Authentication 객체에서 nickname 추출하는 헬퍼 메소드
    private String extractNickname(Authentication auth) {
        Object principal = auth.getPrincipal();
        
        if (principal instanceof org.springframework.security.core.userdetails.User) {
            return ((org.springframework.security.core.userdetails.User) principal).getUsername();
        } else if (principal instanceof Map) {
            // OAuth나 JWT를 사용할 경우 Map 형태일 수 있음
            return (String) ((Map<?, ?>) principal).get("nickname");
        } else {
            // 기본 동작
            return auth.getName();
        }
    }

    // 인기 토론방 조회
    @GetMapping("/debate-rooms/hot")
    public ResponseEntity<List<DebateRoomDto>> getHotDebateRooms() {
        List<DebateRoomDto> rooms = debateRoomService.getHotDebateRooms();
        return ResponseEntity.ok(rooms);
    }

    // 내 토론방 조회
    @GetMapping("/debate-rooms/my")
    public ResponseEntity<List<DebateRoomDto>> getMyDebateRooms() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String nickname = extractNickname(auth);
        List<DebateRoomDto> rooms = debateRoomService.getMyDebateRooms(nickname);
        return ResponseEntity.ok(rooms);
    }

    @PostMapping("/debate-rooms/{roomId}/leave")
    public ResponseEntity<?> leaveRoom(@PathVariable Long roomId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String nickname = extractNickname(auth);
        
        boolean isHost = debateRoomService.isRoomHost(roomId, nickname);
        if (isHost) {
            // 방장이 나가는 경우 방 삭제
            debateRoomService.deleteRoom(roomId, nickname);
            template.convertAndSend("/topic/room/" + roomId, 
                new Message("SYSTEM", "토론 주최자가 퇴장하였습니다. 방이 제거됩니다.", nickname, roomId));
        } else {
            // 일반 참가자가 나가는 경우
            DebateRoomDto room = debateRoomService.leaveRoom(roomId, nickname);
            
            // 토론자B가 나가는 경우 토론 서비스를 통해 처리
            if (room.getDebaterB() == null) {  // debaterB가 null이면 방금 나간 것
                debateService.handleDebaterBLeave(roomId, nickname);
            }
        }
        return ResponseEntity.ok().build();
    }

    // 토론자 B로 등록
    @PostMapping("/debate-rooms/{roomId}/register-as-debater-b")
    public ResponseEntity<DebateRoomDto> registerAsDebaterB(@PathVariable Long roomId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String nickname = extractNickname(auth);
        
        DebateRoomDto room = debateRoomService.joinDebateRoom(roomId, nickname);
        
        // WebSocket을 통해 입장 메시지 전송
        template.convertAndSend("/topic/room/" + roomId,
            new Message("SYSTEM", nickname + "님이 토론자 B로 입장하셨습니다.", "System", roomId));
        
        return ResponseEntity.ok(room);
    }

    @PostMapping("/debate-rooms/{roomId}/join-as-debater-b")
    public ResponseEntity<DebateRoomDto> joinAsDebaterB(@PathVariable Long roomId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String nickname = extractNickname(auth);
        
        DebateRoomDto room = debateRoomService.joinAsDebaterB(roomId, nickname);
        
        // WebSocket을 통해 상태 변경 알림
        template.convertAndSend("/topic/room/" + roomId + "/status", room);
        
        return ResponseEntity.ok(room);
    }
}
