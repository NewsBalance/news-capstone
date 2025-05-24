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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.Enumeration;

@RestController
@RequestMapping("/api")
public class DebateController {

    @Autowired
    private DebateRoomService debateRoomService;

    @Autowired
    private UserService userService;

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
    public ResponseEntity<?> createDebateRoom(@RequestBody CreateRoomRequestDto request, HttpServletRequest httpRequest) {
        // 상세 디버깅 로그 추가
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        // 세션 정보 확인
        HttpSession session = httpRequest.getSession(false);
        System.out.println("세션 ID: " + (session != null ? session.getId() : "null"));
        System.out.println("세션 속성들: " + (session != null ? session.getAttributeNames() : "null"));
        
        if (session != null) {
            Enumeration<String> attributeNames = session.getAttributeNames();
            while (attributeNames.hasMoreElements()) {
                String name = attributeNames.nextElement();
                System.out.println("세션 속성: " + name + " = " + session.getAttribute(name));
            }
        }
        
        // 인증 정보 상세 출력
        System.out.println("Authentication: " + (auth != null ? auth.toString() : "null"));
        System.out.println("Authentication 클래스: " + (auth != null ? auth.getClass().getName() : "null"));
        System.out.println("IsAuthenticated: " + (auth != null ? auth.isAuthenticated() : "null"));
        System.out.println("Principal: " + (auth != null ? auth.getPrincipal() : "null"));
        System.out.println("Principal 클래스: " + (auth != null && auth.getPrincipal() != null ? auth.getPrincipal().getClass().getName() : "null"));
        System.out.println("Authorities: " + (auth != null ? auth.getAuthorities() : "null"));
        
        // 쿠키 정보 확인
        Cookie[] cookies = httpRequest.getCookies();
        System.out.println("쿠키: " + (cookies != null ? cookies.length : "null"));
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                System.out.println("쿠키 이름: " + cookie.getName() + ", 값: " + cookie.getValue());
            }
        }
        
        // 요청 헤더 확인
        Enumeration<String> headerNames = httpRequest.getHeaderNames();
        System.out.println("요청 헤더:");
        while (headerNames.hasMoreElements()) {
            String headerName = headerNames.nextElement();
            System.out.println(headerName + ": " + httpRequest.getHeader(headerName));
        }
        
        // 인증 여부 확인 - 임시 사용자 허용하지 않음
        if (auth == null || !auth.isAuthenticated() || 
            auth.getPrincipal() == null || "anonymousUser".equals(auth.getPrincipal().toString())) {
            
            System.out.println("인증되지 않은 사용자의 방 생성 시도");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "로그인이 필요한 기능입니다."));
        }
        
        try {
            // Principal에서 nickname을 가져오는 로직
            String nickname = extractNickname(auth);
            System.out.println("인증된 사용자: " + nickname);
            
            // 방 생성 로직 실행
            DebateRoomDto room = debateRoomService.createDebateRoom(request, nickname);
            return ResponseEntity.status(HttpStatus.CREATED).body(room);
            
        } catch (Exception e) {
            System.err.println("방 생성 오류: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "방 생성 중 오류가 발생했습니다: " + e.getMessage()));
        }
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
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal().toString())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String nickname = extractNickname(auth);
        DebateRoomDto room = debateRoomService.joinDebateRoom(roomId, nickname);
        return ResponseEntity.ok(room);
    }
    
    // 준비 상태 변경 엔드포인트 
    @PostMapping("/debate-rooms/{roomId}/ready")
    public ResponseEntity<DebateRoomDto> setReady(@PathVariable Long roomId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal().toString())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String nickname = extractNickname(auth);
        DebateRoomDto room = debateRoomService.setReady(roomId, nickname);
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
}
