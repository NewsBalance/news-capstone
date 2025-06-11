package newsbalance.demo.Controller;

import lombok.RequiredArgsConstructor;
import newsbalance.demo.DTO.Request.URLDTO;
import newsbalance.demo.DTO.UrlContentRequestDTO;
import newsbalance.demo.Entity.VideoInfo;
import newsbalance.demo.Entity.YoutubeContent;
import newsbalance.demo.Service.YouTubeService;
import newsbalance.demo.Service.YoutubeContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import newsbalance.demo.DTO.Request.YoutubeContentRequestDTO;

import java.util.*;

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

    @PostMapping("/debug/getdata")
    public ResponseEntity<?> debugSummarize(@RequestBody URLDTO urlDTO) {
    // 이미 DB에 있으면 조회만
    Optional<YoutubeContent> existing = youtubeContentService.getYoutubecontent(urlDTO.getUrl());
    if (existing.isPresent()) {
        return ResponseEntity.ok(existing);
    }

    Map<String, String> request = Collections.singletonMap("url", urlDTO.getUrl());

    try {
        // Flask로 요청
        ResponseEntity<UrlContentRequestDTO> response = restTemplate.postForEntity(
            "http://flask-app:5000/summarize",
            request,
            UrlContentRequestDTO.class
        );
        // 정상 응답 처리
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            youtubeContentService.saveUrlContent(response.getBody());
        } else {
            // 예: 204 No Content 같은 경우
            return ResponseEntity
                .status(response.getStatusCode())
                .body(Collections.singletonMap("error", "Flask 서버가 빈 응답을 보냈습니다."));
        }

        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            // Flask가 4xx, 5xx를 던졌을 때 그대로 내려줌
            String errorBody = ex.getResponseBodyAsString();
            HttpStatus status = ex.getStatusCode();
            return ResponseEntity
                .status(status)
                .body(Collections.singletonMap("error", errorBody));
        } catch (ResourceAccessException ex) {
            // 예: connection refused
            return ResponseEntity
                .status(HttpStatus.GATEWAY_TIMEOUT)
                .body(Collections.singletonMap("error", "Flask 서버 연결 실패: " + ex.getMessage()));
        } catch (Exception ex) {
            // 그 외 예외
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Collections.singletonMap("error", ex.getMessage()));
        }
    
        // 저장 후 다시 조회
        Optional<YoutubeContent> saved = youtubeContentService.getYoutubecontent(urlDTO.getUrl());
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/dockertest")
    public ResponseEntity<Object> dockerTest(){
        String result = "API 통신 성공";
        return new ResponseEntity<>(result, HttpStatus.OK);
    }



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
                                "http://flask-app:5000/summarize",
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
