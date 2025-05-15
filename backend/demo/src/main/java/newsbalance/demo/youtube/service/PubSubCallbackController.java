package newsbalance.demo.youtube.service;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/youtube/callback")
public class PubSubCallbackController {
    // PubSubHubbub 웹훅 컨트롤러 (유튜브 푸시 알림 처리)

    private final YouTubeService youtubeService;

    public PubSubCallbackController(YouTubeService youtubeService) {
        this.youtubeService = youtubeService;
    }

    @GetMapping
    public ResponseEntity<String> verifyCallback(@RequestParam("hub.mode") String mode,
                                                 @RequestParam("hub.challenge") String challenge) {
        if ("subscribe".equals(mode)) {
            return ResponseEntity.ok(challenge);
        }
        return ResponseEntity.badRequest().build();
    }

    @PostMapping
    public ResponseEntity<Void> handleNotification(@RequestBody String feedXml) {
        // 알림이 오면 다시 fetchRecentVideos 실행
        youtubeService.fetchRecentVideos();
        return ResponseEntity.ok().build();
    }
}