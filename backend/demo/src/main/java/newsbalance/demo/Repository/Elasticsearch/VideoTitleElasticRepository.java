package newsbalance.demo.Repository.Elasticsearch;

import newsbalance.demo.Entity.VideoTitleDoc;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;


import java.util.List;

@EnableElasticsearchRepositories
public interface VideoTitleElasticRepository extends ElasticsearchRepository<VideoTitleDoc, String> {
    List<VideoTitleDoc> findByTitleContaining(String title);
}