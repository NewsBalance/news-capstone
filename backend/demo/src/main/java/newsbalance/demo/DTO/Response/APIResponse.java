package newsbalance.demo.DTO.Response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class APIResponse {
    private boolean isSuccess;
    private int code;
    private String message;
    private Object result;

    public APIResponse(boolean isSuccess, int code, String message, Object result) {
        this.isSuccess = isSuccess;
        this.code = code;
        this.message = message;
        this.result = result;
    }
}
