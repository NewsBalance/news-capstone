package newsbalance.demo.Repository.Elasticsearch;

import newsbalance.demo.Entity.YoutubeContent;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;

@EnableElasticsearchRepositories
public interface YoutubeContentElasticRepository extends ElasticsearchRepository<YoutubeContent, Long> {
}
