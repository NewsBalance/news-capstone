package newsbalance.demo.DTO.Request;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EmailVerifyDTO {

    private String email;

    private String code;

}
