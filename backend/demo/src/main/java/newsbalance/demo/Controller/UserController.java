package newsbalance.demo.Controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import newsbalance.demo.Configuration.SessionConst;
import newsbalance.demo.DTO.Request.*;
import newsbalance.demo.DTO.Response.APIResponse;
import newsbalance.demo.Entity.User;
import newsbalance.demo.Service.MailService;
import newsbalance.demo.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;
    @Autowired
    private MailService mailService;

    protected UserRegisterDTO userRegisterDTO;

    // 회원가입
    @PostMapping("/regi")
    public ResponseEntity<?> userRegister(@RequestBody UserRegisterDTO userRegisterDTO) {
        this.userRegisterDTO = userRegisterDTO;
        User newuser = new User(userRegisterDTO.getNickname(), userRegisterDTO.getPassword(), userRegisterDTO.getEmail(), userRegisterDTO.getBirth());

        userService.save(newuser);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(new APIResponse(true, 201, "회원가입에 성공했습니다.", null));
    }


    // 이메일 중복 확인
    @PostMapping("/checkemail")
    public ResponseEntity<APIResponse> checkEmail(@RequestBody EmailDTO emailDTO) {
        boolean isConflicted = userService.isExistbyEmail(emailDTO.getEmail());

        // isConflicted가 ture일 경우 이미 존재하는 이메일이므로 사용 불가능
        // false면 존재하지 않는 이메일이므로 사용가능
        if (!isConflicted) {
            return ResponseEntity
                    .ok(new APIResponse(true, 200, "사용가능한 이메일입니다.", null));
        }

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new APIResponse(false, 409, "이미 존재하는 이메일입니다.", null));
    }

    // 닉네임 중복 확인
    @PostMapping("/checknick")
    public ResponseEntity<APIResponse> checkNickname(@RequestBody NicknameDTO nicknameDTO) {
        boolean isConflicted = userService.isExistbyNickname(nicknameDTO.getNickname());

        // isConflicted가 ture일 경우 이미 존재하는 닉네임이므로 사용 불가능
        // false면 존재하지 않는 닉네임이므로 사용가능
        if (!isConflicted) {
            return ResponseEntity
                    .ok(new APIResponse(true, 200, "사용가능한 닉네임입니다.", null));
        }

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(new APIResponse(false, 409, "이미 존재하는 닉네임입니다.", null));
    }

    // 인증번호 메일 전송
    @PostMapping("/sendcode")
    public ResponseEntity<APIResponse> sendCode(@RequestBody EmailDTO emailDTO) {
        mailService.SendCodeMail(emailDTO.getEmail());

        return ResponseEntity
                .ok(new APIResponse(true, 200, "인증 코드가 전송되었습니다.", null));
    }


    // 인증번호 확인
    @PostMapping("/verifycode")
    public ResponseEntity<APIResponse> verifyCode(@RequestBody EmailVerifyDTO emailVerifyDTO) {
        if (mailService.verifyCode(emailVerifyDTO.getEmail(), emailVerifyDTO.getCode())) {
            return ResponseEntity
                    .ok(new APIResponse(true, 200, "인증 완료", null));
        } else {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new APIResponse(false, 400, "인증 코드가 올바르지 않습니다.", null));
        }
    }


    // 닉네임 수정
    @PostMapping("/changeNickname")
    public ResponseEntity<APIResponse> changeNickname(@RequestBody NicknameDTO nicknameDTO, HttpServletRequest request){
        HttpSession session = request.getSession(false); // 세션이 없으면 null

        if (session == null || session.getAttribute(SessionConst.Login_email) == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new APIResponse(false, 401, "인증이 필요한 서비스입니다.", null));
        }

        String email = SessionConst.Login_email;
        userService.changeNickname(email, nicknameDTO.getNickname());

        return ResponseEntity
                .ok(new APIResponse(true, 200, "성공적으로 닉네임을 변경했습니다.", null));
    }


    // 비밀번호 수정
    @PostMapping("/changePassword")
    public ResponseEntity<APIResponse> changePassword(@RequestBody PasswordDTO passwordDTO, HttpServletRequest request) {
        HttpSession session = request.getSession(false); // 세션이 없으면 null

        if (session == null || session.getAttribute(SessionConst.Login_email) == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new APIResponse(false, 401, "인증이 필요한 서비스입니다.", null));
        }

        String email = SessionConst.Login_email;
        userService.changePassword(email, passwordDTO.getPassword());

        return ResponseEntity
                .ok(new APIResponse(true, 200, "성공적으로 비밀번호를 변경했습니다.", null));
    }


    // 생일, 지역 수정 (프론트에서 작업 후 추가예정)


    // 회원 탈퇴
    @PostMapping("/del")
    public ResponseEntity<APIResponse> deleteUser(HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if (session == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new APIResponse(false, 401, "인증이 필요한 서비스입니다.", null));
        }

        User deleteuser = userService.getUserbyEmail((String) session.getAttribute(SessionConst.Login_email));

        if (deleteuser != null) {
            userService.delete(deleteuser);
            return ResponseEntity
                    .ok(new APIResponse(true, 200, "회원탈퇴가 완료되었습니다.", null));
        } else {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(new APIResponse(false, 400, "회원탈퇴가 정상적으로 완료되지 않았습니다.", null));
        }
    }


}