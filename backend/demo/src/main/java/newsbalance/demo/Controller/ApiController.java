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
        if(youtubeContentService.getYoutubecontent(urlDTO.getUrl()).isPresent()){
            Optional<YoutubeContent> Info = youtubeContentService.getYoutubecontent(urlDTO.getUrl());
            return ResponseEntity.ok(Info);
        }

        Map<String, String> request = new HashMap<>();
        request.put("url", urlDTO.getUrl());

        try {
            // Python 서버로 POST 요청 (응답을 Map 형태로 받음)
            ResponseEntity<UrlContentRequestDTO> response =
                    restTemplate.postForEntity(
                            "http://flask-app:5000/summarize",
                            request,
                            UrlContentRequestDTO.class
                    );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                youtubeContentService.saveUrlContent(response.getBody());
            } else {
                System.err.println("파이썬 서버 오류: " + request);

            }
        } catch (Exception e) {
            // 예외 발생 시 에러 메시지와 함께 500 리턴
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", e.getMessage()));
        }
        Optional<YoutubeContent> Info = youtubeContentService.getYoutubecontent(urlDTO.getUrl());
        return ResponseEntity.ok(Info);
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
