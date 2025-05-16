package newsbalance.demo.Repository;

import newsbalance.demo.Entity.VideoTitleDoc;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;
import org.springframework.stereotype.Repository;

import java.util.List;

@EnableElasticsearchRepositories
public interface VideoTitleElasticRepository extends ElasticsearchRepository<VideoTitleDoc, String> {
    List<VideoTitleDoc> findByTitleContaining(String title);
}