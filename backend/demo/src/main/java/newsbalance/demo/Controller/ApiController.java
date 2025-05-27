package newsbalance.demo.Controller;

import lombok.RequiredArgsConstructor;
import newsbalance.demo.DTO.Request.URLDTO;
import newsbalance.demo.Entity.VideoInfo;
import newsbalance.demo.Service.YouTubeService;
import newsbalance.demo.Service.YoutubeContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import newsbalance.demo.DTO.Request.YoutubeContentRequestDTO;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ApiController {

    @Autowired
    private YoutubeContentService youtubeContentService;
    @Autowired
    private YouTubeService youTubeService;

    @Autowired
    private RestTemplate restTemplate;


    // 기존 단일 URL 처리 엔드포인트는 그대로 두고,
    // 모든 URL을 한 번에 처리하는 엔드포인트를 추가
    @PostMapping("/process-all")
    public ResponseEntity<String> processAllYoutubeUrls() {
        // 1) DB에서 URL 리스트 조회
        List<VideoInfo> videoInfos = youTubeService.getAllVideoInfo();

        // 2) 각 URL마다 Python 서버에 POST 요청
        for (VideoInfo info : videoInfos) {
            Map<String, String> request = new HashMap<>();
            request.put("url", info.videoUrl());


            try {
                ResponseEntity<YoutubeContentRequestDTO> response =
                        restTemplate.postForEntity(
                                "http://localhost:5000/summarize",
                                request,
                                YoutubeContentRequestDTO.class
                        );

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    youtubeContentService.saveContent(response.getBody(), info.title(), info.publishedAt());
                } else {
                    // 로그 남기거나, 실패 URL 리스트에 추가
                    System.err.println("파이썬 서버 오류: " + info.videoUrl());
                }
            } catch (Exception e) {
                // 예외 발생 시 로그
                System.err.println("처리 중 예외 발생: " + info.videoUrl() + " / " + e.getMessage());
            }
        }

        return ResponseEntity.ok("모든 URL 처리 완료");
    }
}
