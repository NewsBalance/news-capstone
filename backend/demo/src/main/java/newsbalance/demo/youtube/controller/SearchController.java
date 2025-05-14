package com.example.youtube.controller;

import com.example.youtube.model.VideoTitleDoc;
import com.example.youtube.model.YouTubeVideo;
import com.example.youtube.repository.VideoTitleElasticRepository;
import com.example.youtube.repository.YouTubeVideoRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/search")
public class SearchController {

    private final VideoTitleElasticRepository elasticRepo;
    private final YouTubeVideoRepository videoRepo;

    public SearchController(VideoTitleElasticRepository elasticRepo, YouTubeVideoRepository videoRepo) {
        this.elasticRepo = elasticRepo;
        this.videoRepo = videoRepo;
    }

    @GetMapping
    public List<YouTubeVideo> search(@RequestParam String query) {
        List<VideoTitleDoc> results = elasticRepo.findByTitleContaining(query);
        return results.stream()
                .map(doc -> videoRepo.findById(doc.getVideoId()).orElse(null))
                .filter(Objects::nonNull)
                .toList();
    }

}
