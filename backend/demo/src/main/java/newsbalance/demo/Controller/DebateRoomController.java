package newsbalance.demo.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import newsbalance.demo.Service.DebateService;
import newsbalance.demo.Service.DebateRoomService;
import newsbalance.demo.DTO.DebateRoomWithMessagesDto;
import org.springframework.http.HttpStatus;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.persistence.EntityNotFoundException;

import java.util.Map;

@RestController
@RequestMapping("/debate-room")
public class DebateRoomController {

    private final DebateService debateService;
    private final DebateRoomService debateRoomService;

    public DebateRoomController(DebateService debateService, DebateRoomService debateRoomService) {
        this.debateService = debateService;
        this.debateRoomService = debateRoomService;
    }

    // 토론방 입장
    @PostMapping("/{roomId}/enter")
    public ResponseEntity<?> enterRoom(@PathVariable Long roomId, HttpServletRequest request) {
        try {
            debateService.enterDebateRoom(roomId, request);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 토론방 퇴장
    @PostMapping("/{roomId}/leave")
    public ResponseEntity<?> leaveRoom(@PathVariable Long roomId, HttpServletRequest request) {
        try {
            debateService.leaveDebateRoom(roomId, request);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<?> getDebateRoom(@PathVariable Long roomId) {
        try {
            DebateRoomWithMessagesDto roomDto = debateRoomService.getDebateRoomWithMessages(roomId);
            
            // 로깅 추가 - 반환하는 메시지 수 확인
            System.out.println("API 응답: 토론방 " + roomId + "의 메시지 수: " + 
                (roomDto.getMessages() != null ? roomDto.getMessages().size() : 0));
            
            return ResponseEntity.ok(roomDto);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
} 