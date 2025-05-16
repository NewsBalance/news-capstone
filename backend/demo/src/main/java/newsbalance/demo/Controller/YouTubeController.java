package newsbalance.demo.Controller;

import newsbalance.demo.Service.YouTubeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/youtube")
public class YouTubeController {

    private final YouTubeService youtubeService;

    public YouTubeController(YouTubeService youTubeService) {
        this.youtubeService = youTubeService;
    }

    // 최근 영상 수집 (채널 기반) http://localhost:8080/youtube/fetch/recent
    @PostMapping("/fetch/recent")
    public String fetchRecentVideos() {
        youtubeService.fetchRecentVideos();
        return "✅ 최근 영상 수집 완료!";
    }

    // 키워드 기반 영상 수집 (POST)
    @PostMapping("/fetch/keyword")
    public String fetchByKeyword(@RequestParam String keyword) {
        return youtubeService.fetchAndSaveVideosByKeyword(keyword);
    }

    // 키워드 기반 영상 수집 (GET) - 같은 기능 제공
    @GetMapping("/fetch/keyword")
    public ResponseEntity<String> fetchByKeywordGet(@RequestParam String keyword) {
        String result = youtubeService.fetchAndSaveVideosByKeyword(keyword);
        return ResponseEntity.ok(result);
    }
}
