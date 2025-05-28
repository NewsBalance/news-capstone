package newsbalance.demo.Repository.Elasticsearch;

import newsbalance.demo.Entity.YoutubeContentElastic;
import org.springframework.data.elasticsearch.annotations.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;

import java.util.List;

@EnableElasticsearchRepositories
public interface YoutubeContentElasticRepository extends ElasticsearchRepository<YoutubeContentElastic, String> {

    @Query("{\"wildcard\": { \"title\": \"*?0*\" }}")
    List<YoutubeContentElastic> findByTitleWildcard(String query);

}
