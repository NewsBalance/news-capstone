package newsbalance.demo.Controller;


import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import newsbalance.demo.Configuration.SessionConst;
import newsbalance.demo.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/Login")
public class LoginController {

    @Autowired
    private UserService userService;

    protected UserRegisterDTO userRegisterDTO;

    @PostMapping("/login")
    public ResponseEntity<?> Login(@ModelAttribute UserRegisterDTO userRegisterDTO, HttpServletRequest request) {
        this.userRegisterDTO = userRegisterDTO;

        // 유저 이메일, 비밀번호가져오기
        String login_email = userRegisterDTO.getEmail();
        String login_password = userRegisterDTO.getPassword();

        // db 조회
        userService.login(login_email, login_password);

        HttpSession session = request.getSession();
        session.setAttribute(SessionConst.Login_email, login_email);

        return ResponseEntity.ok("success");
    }

    // 인증번호 메일 전송

    // 인증번호 확인

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false); // 세션이 없으면 null 반환
        if (session != null) {
            session.invalidate(); // 세션 무효화
        }

        return ResponseEntity.ok(200);
    }

}
