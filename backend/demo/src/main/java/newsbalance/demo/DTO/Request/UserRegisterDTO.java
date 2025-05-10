package newsbalance.demo.DTO.Request;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserRegisterDTO {


    private String nickname;

    private String password;

    private String email;

}
