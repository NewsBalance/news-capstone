package newsbalance.demo.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import newsbalance.demo.Service.DebateService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/debate-room")
public class DebateRoomController {

    private final DebateService debateService;

    public DebateRoomController(DebateService debateService) {
        this.debateService = debateService;
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
} 