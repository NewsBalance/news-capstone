package newsbalance.demo.Controller;

import newsbalance.demo.DTO.Request.SummarySentenceDTO;
import newsbalance.demo.Entity.SummarySentence;
import newsbalance.demo.Entity.YoutubeContentElastic;
import newsbalance.demo.Repository.Elasticsearch.YoutubeContentElasticRepository;
import newsbalance.demo.Service.YouTubeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/search")
public class SearchController {

    @Autowired
    private YouTubeService youTubeService;

    private final YoutubeContentElasticRepository contentRepo;

    public SearchController(YoutubeContentElasticRepository contentRepo) {
        this.contentRepo = contentRepo;
    }

    @GetMapping("/titles")
    public List<YoutubeContentElastic> search(@RequestParam String query) {
        return contentRepo.findByTitleWildcard(query);
    }

    @GetMapping("/summaries")
    public ResponseEntity<List<SummarySentenceDTO>> getSummaries(@RequestParam("videoUrl") String url){
        List<SummarySentenceDTO> list = youTubeService.getSummariesByVideoUrl(url);
        return ResponseEntity.ok(list);
    }
}
