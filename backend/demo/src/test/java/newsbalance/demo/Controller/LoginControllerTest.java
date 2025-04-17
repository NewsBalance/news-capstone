package newsbalance.demo.Controller;

import newsbalance.demo.Entity.User;
import newsbalance.demo.Service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class LoginControllerTest {

    @Autowired
    private UserService userService;

    @Test
    void 로그인_확인() {
        User newuser = new User("test2", "1q2w3e4r5t", "aa@aaaa.com");
        userService.save(newuser);

        User login = userService.login("aa@aaaa.com", "1q2w3e4r5t");

        assertNotNull(login, "로그인에 실패했습니다. 반환된 User 객체가 null입니다.");
        assertEquals("test2", login.getUsername(), "사용자명이 일치하지 않습니다.");
        assertEquals("aa@aaaa.com", login.getEmail(), "이메일이 일치하지 않습니다.");
    }
}