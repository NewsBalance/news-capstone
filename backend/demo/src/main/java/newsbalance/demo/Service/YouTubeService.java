package newsbalance.demo.Service;

import newsbalance.demo.Configuration.YouTubeConfig;
import newsbalance.demo.Entity.VideoInfo;
import newsbalance.demo.Entity.VideoTitleDoc;
import newsbalance.demo.Entity.YouTubeVideo;
import newsbalance.demo.Repository.JPA.YoutubeContentRepository;
import newsbalance.demo.Repository.Elasticsearch.VideoTitleElasticRepository;
import newsbalance.demo.Repository.JPA.YouTubeVideoRepository;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class YouTubeService {

    // 수동 수집 및 자막 포함 저장, Elasticsearch 동기화
    @Autowired
    private final YouTubeVideoRepository videoRepo;
    @Autowired
    private final VideoTitleElasticRepository elasticRepo;
    @Autowired
    private final YoutubeContentRepository contentRepo;

    private final YouTubeConfig config;

    public YouTubeService(YouTubeVideoRepository videoRepo,
                          VideoTitleElasticRepository elasticRepo,
                          YoutubeContentRepository contentRepo,
                          YouTubeConfig config) {
        this.videoRepo = videoRepo;
        this.elasticRepo = elasticRepo;
        this.contentRepo = contentRepo;
        this.config = config;
    }

    public void fetchRecentVideos() {
        String apiKey = config.getApiKey();
        List<String> channelIds = config.getChannelIds();

        // RFC3339 UTC Zulu 형식
        String afterDate = LocalDate.now().minusMonths(3)
                .atStartOfDay()
                .atZone(java.time.ZoneId.of("UTC"))
                .format(DateTimeFormatter.ISO_INSTANT);

        for (String channelId : channelIds) {
            String url = "https://www.googleapis.com/youtube/v3/search?part=snippet" +
                    "&channelId=" + channelId +
                    "&maxResults=3&order=date&type=video" +
                    "&publishedAfter=" + afterDate +
                    "&key=" + apiKey;

            String response = WebClient.create()
                    .get().uri(url)
                    .retrieve().bodyToMono(String.class)
                    .block();

            JSONObject json = new JSONObject(response);
            for (Object itemObj : json.getJSONArray("items")) {
                JSONObject item = (JSONObject) itemObj;
                JSONObject snippet = item.getJSONObject("snippet");
                String videoId = item.getJSONObject("id").getString("videoId");

                if (!videoRepo.existsById(videoId)) {
                    String title = snippet.getString("title");
                    String publishedAtStr = snippet.getString("publishedAt");
                    OffsetDateTime odt = OffsetDateTime.parse(publishedAtStr);
                    LocalDateTime publishedAt = odt.toLocalDateTime();
                    String videoUrl = "https://www.youtube.com/watch?v=" + videoId;
                    String caption = fetchAutoCaption(videoId); // 구현 생략

                    YouTubeVideo video = new YouTubeVideo();
                    video.setVideoId(videoId);
                    video.setTitle(title);
                    video.setPublishedAt(publishedAt);
                    video.setVideoUrl(videoUrl);
                    video.setCaption(caption);

                    videoRepo.save(video);
                    elasticRepo.save(new VideoTitleDoc(videoId, title, videoUrl));
                }
            }
        }
    }


    public String fetchAndSaveVideosByKeyword(String keyword) {
        String apiKey = config.getApiKey();
        String url = "https://www.googleapis.com/youtube/v3/search" +
                "?part=snippet" +
                "&maxResults=10" +
                "&q=" + keyword +
                "&type=video" +
                "&key=" + apiKey;

        String response = WebClient.create()
                .get().uri(url)
                .retrieve().bodyToMono(String.class)
                .block();

        JSONObject json = new JSONObject(response);
        int savedCount = 0;

        for (Object itemObj : json.getJSONArray("items")) {
            JSONObject item = (JSONObject) itemObj;
            JSONObject snippet = item.getJSONObject("snippet");
            String videoId = item.getJSONObject("id").getString("videoId");

            if (!videoRepo.existsById(videoId)) {
                String title = snippet.getString("title");
                LocalDateTime publishedAt = LocalDateTime.parse(
                        snippet.getString("publishedAt"),
                        DateTimeFormatter.ISO_DATE_TIME
                );
                String videoUrl = "https://www.youtube.com/watch?v=" + videoId;
                String caption = fetchAutoCaption(videoId); // 자동 자막 텍스트 예시

                YouTubeVideo video = new YouTubeVideo();
                video.setVideoId(videoId);
                video.setTitle(title);
                video.setPublishedAt(publishedAt);
                video.setVideoUrl(videoUrl);
                video.setCaption(caption);

                videoRepo.save(video);
                elasticRepo.save(new VideoTitleDoc(videoId, title, videoUrl));
                savedCount++;
            }
        }

        return "총 " + savedCount + "개의 영상을 키워드 [" + keyword + "]로 저장했습니다.";
    }

    private String fetchAutoCaption(String videoId) {
        return "";
    }

    public List<VideoInfo> getAllVideoInfo() {
        return videoRepo.findAllProjectedBy()
                .stream()
                .map(p -> new VideoInfo(
                        p.getVideoUrl(),
                        p.getTitle(),
                        p.getPublishedAt()
                                .atZone(ZoneId.systemDefault())
                                .toEpochSecond()
                ))
                .collect(Collectors.toList());
    }

}