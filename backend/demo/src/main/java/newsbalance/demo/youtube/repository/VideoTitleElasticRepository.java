package com.example.youtube.repository;

import com.example.youtube.model.VideoTitleDoc;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;

public interface VideoTitleElasticRepository extends ElasticsearchRepository<VideoTitleDoc, String> {
    List<VideoTitleDoc> findByTitleContaining(String title);
}