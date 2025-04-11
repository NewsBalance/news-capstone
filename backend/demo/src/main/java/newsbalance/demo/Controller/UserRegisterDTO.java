package newsbalance.demo.Controller;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserRegisterDTO {

    private String username;

    private String password;

    private String email;

}
