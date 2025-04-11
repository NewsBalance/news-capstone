package newsbalance.demo.Controller;

import newsbalance.demo.Entity.User;
import newsbalance.demo.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/UserRegi")
public class UserController {

    @Autowired
    private UserService userService;

    protected UserRegisterDTO userRegisterDTO;

    @PostMapping("/new")
    public ResponseEntity<?> userRegister(@RequestBody UserRegisterDTO userRegisterDTO){
        this.userRegisterDTO = userRegisterDTO;
        User newuser = new User(userRegisterDTO.getUsername(), userRegisterDTO.getPassword(), userRegisterDTO.getEmail());

        userService.save(newuser);
        return ResponseEntity.ok("success");
    }

}