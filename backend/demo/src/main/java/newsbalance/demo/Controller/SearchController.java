package newsbalance.demo.Controller;

import newsbalance.demo.Entity.YoutubeContentElastic;
import newsbalance.demo.Repository.Elasticsearch.YoutubeContentElasticRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/search")
public class SearchController {

    private final YoutubeContentElasticRepository contentRepo;

    public SearchController(YoutubeContentElasticRepository contentRepo) {
        this.contentRepo = contentRepo;
    }

    @GetMapping("/titles")
    public List<YoutubeContentElastic> search(@RequestParam String query) {
        return contentRepo.findByTitleWildcard(query);
    }

}
