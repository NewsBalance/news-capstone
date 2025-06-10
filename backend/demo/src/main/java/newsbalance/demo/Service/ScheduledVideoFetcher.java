package newsbalance.demo.Service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ScheduledVideoFetcher {

    private final YouTubeService youtubeService;

    public ScheduledVideoFetcher(YouTubeService youtubeService) {
        this.youtubeService = youtubeService;
    }

    @Scheduled(cron = "0 0 1 * * ?") // 매일 1시 실행
    public void run() {
        youtubeService.fetchRecentVideos();
    }
}