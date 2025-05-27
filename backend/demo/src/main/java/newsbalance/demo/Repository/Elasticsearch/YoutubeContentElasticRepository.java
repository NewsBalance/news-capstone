package newsbalance.demo.Repository.Elasticsearch;

import newsbalance.demo.Entity.YoutubeContent;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;

import java.util.List;

@EnableElasticsearchRepositories
public interface YoutubeContentElasticRepository extends ElasticsearchRepository<YoutubeContent, Long> {




}
