package newsbalance.demo.Controller;

import newsbalance.demo.Entity.User;
import newsbalance.demo.Service.UserService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class UserControllerTest {

    @Autowired
    private UserService userService;

    @Test
    void 회원가입() {
        User newuser = new User("test1", "1q2w3e4r", "aa@aaaa.com");
        userService.save(newuser);
    }
}