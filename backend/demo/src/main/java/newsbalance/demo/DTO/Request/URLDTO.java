package newsbalance.demo.DTO.Request;

import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Builder
@Getter
@Setter
public class URLDTO {
    private String url;
}
