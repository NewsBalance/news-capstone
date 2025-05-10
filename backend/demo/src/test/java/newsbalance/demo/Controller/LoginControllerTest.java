package newsbalance.demo.Controller;

import newsbalance.demo.Entity.User;
import newsbalance.demo.Service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class LoginControllerTest {

    @Autowired
    private UserService userService;

    @Test
    void 로그인_확인() {
        User newuser = new User("test2", "1q2w3e4r5t", "aa@aaaa.com");
        userService.save(newuser);

        boolean login = userService.login("aa@aaaa.com", "1q2w3e4r5t");

        assertTrue(login, "실패");
    }
}