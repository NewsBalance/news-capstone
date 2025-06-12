package newsbalance.demo.Controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import newsbalance.demo.Configuration.SessionConst;
import newsbalance.demo.DTO.Request.LoginDTO;
import newsbalance.demo.DTO.Response.APIResponse;
import newsbalance.demo.DTO.Response.SessionInfo;
import newsbalance.demo.DTO.Response.UserProfileDTO;
import newsbalance.demo.Entity.User;
import newsbalance.demo.Service.MailService;
import newsbalance.demo.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;

@RestController
@RequestMapping("/session")
public class SessionController {

    @Autowired
    private UserService userService;

    @Autowired
    private MailService mailService;

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<APIResponse> login(@RequestBody LoginDTO loginDTO, HttpServletRequest request) {
        String email = loginDTO.getEmail();
        String password = loginDTO.getPassword();

        try {
            boolean isAuthenticated = userService.login(email, password);
            
            if (!isAuthenticated) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new APIResponse(false, 401, "이메일 또는 비밀번호가 올바르지 않습니다.", null));
            }

            User user = userService.getUserbyEmail(email);

            HttpSession session = request.getSession(true);
            session.setAttribute("userEmail", email);
            session.setAttribute("userNickname", user.getNickname());
            session.setAttribute("userId", user.getId());
            session.setAttribute(SessionConst.Login_nickname, user.getNickname());

            // 프론트엔드가 기대하는 형식으로 데이터 구성
            HashMap<String, Object> userInfo = new HashMap<>();
            userInfo.put("id", user.getId());
            userInfo.put("nickname", user.getNickname());
            userInfo.put("email", user.getEmail());
            userInfo.put("role", "USER"); // 역할 정보 추가

            return ResponseEntity.ok(new APIResponse(true, 200, "로그인 성공", userInfo));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new APIResponse(false, 500, "로그인 처리 중 오류가 발생했습니다: " + e.getMessage(), null));
        }
    }

    // 내 세션 확인
    @GetMapping("/my")
    public ResponseEntity<APIResponse> checkSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("userEmail") == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new APIResponse(false, 401, "로그인 상태가 아닙니다.", null));
        }
    
        String email = (String) session.getAttribute("userEmail");
        String nickname = (String) session.getAttribute("userNickname");
        Long userId = (Long) session.getAttribute("userId");
    
        // 프론트엔드가 기대하는 형식으로 데이터 구성
        HashMap<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", userId);
        userInfo.put("nickname", nickname);
        userInfo.put("email", email);
        userInfo.put("role", "USER"); // 역할 정보 추가
    
        return ResponseEntity.ok(new APIResponse(true, 200, "현재 로그인 상태입니다.", userInfo));
    }

    // 프로필 조회
    @GetMapping("/Profile/{nickname}")
    public ResponseEntity<APIResponse> getuserProfile(@PathVariable String nickname) {
        User user = userService.getUserbyNickname(nickname);

        if (user == null) {
            return ResponseEntity
                    .status(404)
                    .body(new APIResponse(false, 404, "찾을 수 없는 유저", null));
        }

        UserProfileDTO userDTO = UserProfileDTO.builder()
                .nickname(user.getNickname())
                .email(user.getEmail())
                .bio(user.getBio())
                .build();

        return ResponseEntity
                .ok(new APIResponse(true, 200, "유저 정보 가져오기 성공", userDTO));
    }

    // 로그아웃
    @PostMapping("/logout")
    public ResponseEntity<APIResponse> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        return ResponseEntity.ok(new APIResponse(true, 200, "로그아웃 성공", null));
    }
}
