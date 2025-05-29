package newsbalance.demo.Repository.Elasticsearch;

import newsbalance.demo.Entity.YoutubeContent;
import newsbalance.demo.Entity.YoutubeContentElastic;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;

import java.util.List;

@EnableElasticsearchRepositories
public interface YoutubeContentElasticRepository extends ElasticsearchRepository<YoutubeContent, Integer> {

    @Query("{\"wildcard\": { \"title\": \"*?0*\" }}")
    List<YoutubeContent> findByTitleWildcard(String query);

}
