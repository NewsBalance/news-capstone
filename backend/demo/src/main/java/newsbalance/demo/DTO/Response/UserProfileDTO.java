package newsbalance.demo.DTO.Response;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {

    private String nickname;

    private String email;

    private String bio;


}
