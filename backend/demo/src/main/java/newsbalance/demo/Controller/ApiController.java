package newsbalance.demo.Controller;

import lombok.RequiredArgsConstructor;
import newsbalance.demo.DTO.Request.URLDTO;
import newsbalance.demo.Service.YoutubeContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import newsbalance.demo.DTO.Request.YoutubeContentRequestDTO;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ApiController {

    @Autowired
    private YoutubeContentService youtubeContentService;

    @Autowired
    private RestTemplate restTemplate;

    @PostMapping("/process")
    public ResponseEntity<String> processYoutubeUrl(@RequestBody URLDTO url) {
        String pythonApiUrl = "http://localhost:5000/summarize"; // 파이썬 서버 주소
        String geturl = url.getUrl();

        // 파이썬 서버로 보낼 JSON
        Map<String, String> request = new HashMap<>();
        request.put("url", geturl);

        // POST 요청 보내고 결과 받기
        ResponseEntity<YoutubeContentRequestDTO> response =
                restTemplate.postForEntity(pythonApiUrl, request, YoutubeContentRequestDTO.class);

        if (response.getStatusCode().is2xxSuccessful()) {
            youtubeContentService.saveContent(response.getBody());
            return ResponseEntity.ok("처리 및 저장 완료");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body("파이썬 서버 오류");
        }
    }
}
