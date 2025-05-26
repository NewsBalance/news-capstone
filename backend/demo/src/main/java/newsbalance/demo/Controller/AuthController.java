package newsbalance.demo.Controller;

import lombok.extern.slf4j.Slf4j;
import newsbalance.demo.Config.JwtTokenProvider;
import newsbalance.demo.DTO.Request.LoginDTO;
import newsbalance.demo.DTO.Request.UserRegisterDTO;
import newsbalance.demo.Entity.User;
import newsbalance.demo.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Slf4j
public class AuthController {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDTO loginRequest) {
        log.debug("로그인 요청: {}", loginRequest.getEmail());
        
        try {
            // 사용자 검증
            User user = userService.validateUser(loginRequest.getEmail(), loginRequest.getPassword());
            log.debug("사용자 검증 성공: {}", user.getNickname());
            
            // 토큰 생성
            String token = jwtTokenProvider.createToken(user.getNickname(), user.getRole().toString());
            log.debug("토큰 생성 완료");
            
            // 응답 데이터 구성
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("nickname", user.getNickname());
            response.put("id", user.getId());
            response.put("role", user.getRole().toString());
            
            log.debug("로그인 성공 응답: {}", response);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("로그인 실패: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody UserRegisterDTO registerRequest) {
        log.debug("회원가입 요청: {}", registerRequest.getEmail());
        
        try {
            // 사용자 등록
            User newUser = userService.registerUser(
                registerRequest.getNickname(),
                registerRequest.getPassword(),
                registerRequest.getEmail(),
                registerRequest.getBirth()
            );
            log.debug("사용자 등록 성공: {}", newUser.getNickname());
            
            // 토큰 생성
            String token = jwtTokenProvider.createToken(newUser.getNickname(), newUser.getRole().toString());
            log.debug("토큰 생성 완료");
            
            // 응답 데이터 구성
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("nickname", newUser.getNickname());
            response.put("id", newUser.getId());
            response.put("role", newUser.getRole().toString());
            
            log.debug("회원가입 성공 응답: {}", response);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("회원가입 실패: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/api/login")
    public ResponseEntity<?> loginApi(@RequestBody LoginDTO loginRequest) {
        log.debug("API 로그인 요청: {}", loginRequest.getEmail());
        return processLogin(loginRequest);
    }
    
    @PostMapping("/Login/login")
    public ResponseEntity<?> loginLegacy(@RequestBody LoginDTO loginRequest) {
        log.debug("레거시 로그인 요청: {}", loginRequest.getEmail());
        return processLogin(loginRequest);
    }
    
    private ResponseEntity<?> processLogin(LoginDTO loginRequest) {
        try {
            // 사용자 검증
            User user = userService.validateUser(loginRequest.getEmail(), loginRequest.getPassword());
            log.debug("사용자 검증 성공: {}", user.getNickname());
            
            // 토큰 생성
            String token = jwtTokenProvider.createToken(user.getNickname(), user.getRole().toString());
            log.debug("토큰 생성 완료");
            
            // 응답 데이터 구성
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("nickname", user.getNickname());
            response.put("id", user.getId());
            response.put("role", user.getRole().toString());
            
            log.debug("로그인 성공 응답: {}", response);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("로그인 실패: {}", e.getMessage(), e);
            Map<String, Object> response = new HashMap<>();
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/Register/register")
    public ResponseEntity<?> registerLegacy(@RequestBody UserRegisterDTO registerRequest) {
        log.debug("레거시 회원가입 요청: {}", registerRequest.getEmail());
        return register(registerRequest);
    }
} 