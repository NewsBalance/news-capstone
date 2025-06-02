package newsbalance.demo.Controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import newsbalance.demo.DTO.*;
import newsbalance.demo.Service.DebateRoomService;
import newsbalance.demo.Service.DebateService;
import newsbalance.demo.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import newsbalance.demo.Entity.Message;

import java.util.List;

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


    private String getNicknameFromSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) return null;
        return (String) session.getAttribute("userNickname");
    }


    // 사용자 정보 조회 
    @GetMapping("/user/info")
    public ResponseEntity<UserInfoDto> getUserInfo(HttpServletRequest request) {
        String nickname = getNicknameFromSession(request);
        if (nickname == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(userService.getUserInfo(nickname));
    }

    // 토론방 목록 조회
    @GetMapping("/debate-rooms")
    public ResponseEntity<List<DebateRoomDto>> getAllDebateRooms() {
        return ResponseEntity.ok(debateRoomService.getAllDebateRooms());
    }

    // 토론방 생성
    @PostMapping("/debate-rooms")
    public ResponseEntity<DebateRoomDto> createDebateRoom(@RequestBody CreateRoomRequestDto request, HttpServletRequest httpRequest) {
        String nickname = getNicknameFromSession(httpRequest);
        if (nickname == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        // 요청에 topic이 포함되어 있는지 확인
        System.out.println("토론방 생성 요청 - title: " + request.getTitle() + ", topic: " + (request.getTopic() != null ? request.getTopic() : "null"));
        return ResponseEntity.ok(debateRoomService.createDebateRoom(request, nickname));
    }

    // 특정 토론방 조회
    @GetMapping("/debate-rooms/{roomId}")
    public ResponseEntity<DebateRoomWithMessagesDto> getDebateRoom(@PathVariable Long roomId) {
        DebateRoomWithMessagesDto room = debateRoomService.getDebateRoomWithMessages(roomId);
        // topic 정보가 누락되지 않았는지 확인하는 로그 추가
        System.out.println("토론방 조회 - roomId: " + roomId + ", topic: " + (room.getTopic() != null ? room.getTopic() : "null"));
        return ResponseEntity.ok(room);
    }

    // 토론 메시지 전송
    @PostMapping("/debate-rooms/{roomId}/message")
    public ResponseEntity<MessageDto> sendMessage(@PathVariable Long roomId, @RequestBody MessageRequestDto messageRequest, HttpServletRequest request) {
        String nickname = getNicknameFromSession(request);
        if (nickname == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(debateRoomService.saveMessage(roomId, messageRequest, nickname));
    }

    // 채팅 메시지 조회
    @GetMapping("/debate-rooms/{roomId}/chat")
    public ResponseEntity<ChatMessagesDto> getChatMessages(@PathVariable Long roomId) {
        return ResponseEntity.ok(new ChatMessagesDto(debateRoomService.getChatMessages(roomId)));
    }

    // 채팅 메시지 전송
    @PostMapping("/debate-rooms/{roomId}/chat")
    public ResponseEntity<Void> sendChatMessage(@PathVariable Long roomId, @RequestBody ChatMessageRequestDto chatRequest, HttpServletRequest request) {
        String nickname = getNicknameFromSession(request);
        if (nickname == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        debateRoomService.saveChatMessage(roomId, chatRequest.getMessage(), nickname);
        return ResponseEntity.ok().build();
    }
    
    // 토론방 참가 엔드포인트 
    @PostMapping("/debate-rooms/{roomId}/join")
    public ResponseEntity<DebateRoomDto> joinDebateRoom(@PathVariable Long roomId, HttpServletRequest request) {
        String nickname = getNicknameFromSession(request);
        if (nickname == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        DebateRoomDto room = debateRoomService.joinRoom(roomId, nickname);
        if (room.getDebaterB() != null && room.getDebaterB().equals(nickname)) {
            Message message = new Message("SYSTEM", nickname + "님이 토론자로 입장하셨습니다.", "System", roomId);
            System.out.println("메시지 전송: " + message.getContent() + " 경로: /topic/room/" + roomId);
            template.convertAndSend("/topic/room/" + roomId, message);
        }
        return ResponseEntity.ok(room);
    }


    // 준비 상태 변경 엔드포인트 
    @PostMapping("/debate-rooms/{roomId}/ready")
    public ResponseEntity<DebateRoomDto> toggleReady(@PathVariable Long roomId, HttpServletRequest request) {
        String nickname = getNicknameFromSession(request);
        if (nickname == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        DebateRoomDto room = debateRoomService.toggleReady(roomId, nickname);
        template.convertAndSend("/topic/room/" + roomId + "/status", room);
        return ResponseEntity.ok(room);
    }

    // 인기 토론방 조회
    @GetMapping("/debate-rooms/hot")
    public ResponseEntity<List<DebateRoomDto>> getHotDebateRooms() {
        return ResponseEntity.ok(debateRoomService.getHotDebateRooms());
    }

    // 내 토론방 조회
    @GetMapping("/debate-rooms/my")
    public ResponseEntity<List<DebateRoomDto>> getMyDebateRooms(HttpServletRequest request) {
        String nickname = getNicknameFromSession(request);
        if (nickname == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(debateRoomService.getMyDebateRooms(nickname));
    }

    @PostMapping("/debate-rooms/{roomId}/leave")
    public ResponseEntity<?> leaveRoom(@PathVariable Long roomId, HttpServletRequest request) {
        String nickname = getNicknameFromSession(request);
        if (nickname == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        boolean isHost = debateRoomService.isRoomHost(roomId, nickname);
        if (isHost) {
            debateRoomService.deleteRoom(roomId, nickname);
            template.convertAndSend("/topic/room/" + roomId, new Message("SYSTEM", "토론 주최자가 퇴장하였습니다. 방이 제거됩니다.", nickname, roomId));
        } else {
            DebateRoomDto room = debateRoomService.leaveRoom(roomId, nickname);
            if (room.getDebaterB() == null) {
                debateService.handleDebaterBLeave(roomId, nickname);
            }
        }
        return ResponseEntity.ok().build();
    }

    // 토론자 B로 등록
    @PostMapping("/debate-rooms/{roomId}/register-as-debater-b")
    public ResponseEntity<DebateRoomDto> registerAsDebaterB(@PathVariable Long roomId, HttpServletRequest request) {
        String nickname = getNicknameFromSession(request);
        if (nickname == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        DebateRoomDto room = debateRoomService.joinDebateRoom(roomId, nickname);
        Message message = new Message("SYSTEM", nickname + "님이 토론자 B로 입장하셨습니다.", "System", roomId);
        System.out.println("메시지 전송: " + message.getContent() + " 경로: /topic/room/" + roomId);
        template.convertAndSend("/topic/room/" + roomId, message);
        return ResponseEntity.ok(room);
    }

    @PostMapping("/debate-rooms/{roomId}/join-as-debater-b")
    public ResponseEntity<DebateRoomDto> joinAsDebaterB(@PathVariable Long roomId, HttpServletRequest request) {
        String nickname = getNicknameFromSession(request);
        if (nickname == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        DebateRoomDto room = debateRoomService.joinAsDebaterB(roomId, nickname);
        template.convertAndSend("/topic/room/" + roomId + "/status", room);
        return ResponseEntity.ok(room);
    }
}
