package newsbalance.demo.youtube.repository;

import newsbalance.demo.youtube.model.VideoTitleDoc;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;

import java.util.List;

public interface VideoTitleElasticRepository extends ElasticsearchRepository<VideoTitleDoc, String> {
    List<VideoTitleDoc> findByTitleContaining(String title);
}