package newsbalance.demo.Controller;

import newsbalance.demo.DTO.Request.SummarySentenceDTO;
import newsbalance.demo.Entity.SummarySentence;
import newsbalance.demo.Entity.YoutubeContent;
import newsbalance.demo.Entity.YoutubeContentElastic;
import newsbalance.demo.Repository.Elasticsearch.YoutubeContentElasticRepository;
import newsbalance.demo.Service.YouTubeService;
import newsbalance.demo.Service.YoutubeContentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/search")
public class SearchController {

    @Autowired
    private YouTubeService youTubeService;
    @Autowired
    private YoutubeContentService contentService;
    @Autowired
    private YoutubeContentElasticRepository contentRepo;

    @GetMapping("/titles")
    public List<YoutubeContent> search(@RequestParam String query) {
        return contentRepo.findByTitleWildcard(query);
    }

    @GetMapping("/info")
    public ResponseEntity<Optional<YoutubeContent>> getSummaries(@RequestParam("videoUrl") String url){
        Optional<YoutubeContent> Info = contentService.getYoutubecontent(url);
        return ResponseEntity.ok(Info);
    }
}
