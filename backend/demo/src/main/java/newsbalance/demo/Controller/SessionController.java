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
        try {
            String email = loginDTO.getEmail();
            String password = loginDTO.getPassword();

            boolean isAuthenticated = userService.login(email, password); // 로그인 결과 true/false로 반환하도록 설계

            if (!isAuthenticated) {
                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(new APIResponse(false, 401, "이메일 또는 비밀번호가 올바르지 않습니다.", null));
            }

            User user = userService.getUserbyEmail(email);

            HttpSession session = request.getSession();
            session.setAttribute(SessionConst.Login_email, email);
            session.setAttribute(SessionConst.Login_nickname, user.getNickname());

            return ResponseEntity
                    .ok(new APIResponse(true, 200, "로그인 성공", user.getNickname()));
        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new APIResponse(false, 500, "로그인 중 오류 발생", e.getMessage()));
        }
    }

    // 내 세션 확인
    @GetMapping("/my")
    public ResponseEntity<APIResponse> checkSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false); // 세션이 없으면 null 반환

        if (session != null) {
            String loginEmail = (String) session.getAttribute(SessionConst.Login_email);
            String loginNickname = (String) session.getAttribute(SessionConst.Login_nickname);
            if (loginEmail != null) {
                SessionInfo info = new SessionInfo(loginEmail, loginNickname);
                return ResponseEntity
                        .ok(new APIResponse(true, 200, "현재 로그인 상태입니다.", info));
            }
        }

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(new APIResponse(false, 401, "로그인 상태가 아닙니다.", null));
    }

    // 다른 사람 프로필 조회
    @GetMapping("/Profile/{nickname}")
    public ResponseEntity<APIResponse> getuserProfile(@PathVariable String nickname){
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
        HttpSession session = request.getSession(false); // 세션이 없으면 null

        if (session != null) {
            session.invalidate();
            return ResponseEntity
                    .ok(new APIResponse(true, 200, "로그아웃 성공", null));
        } else {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new APIResponse(false, 400, "로그인 상태가 아닙니다.", null));
        }
    }

//    // 비밀번호 찾기(이메일 입력)
//    @PostMapping("/findPassword")
//    public ResponseEntity<APIResponse> findPassword(@RequestBody EmailDTO emailDTO) {
//        // 이메일로 인증번호를 보냄
//        // 입력받은 번호가 맞는 지 확인
//    }
}
