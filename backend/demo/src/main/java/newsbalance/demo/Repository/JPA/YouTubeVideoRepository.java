package newsbalance.demo.Repository.JPA;

import newsbalance.demo.Entity.YouTubeVideo;
import newsbalance.demo.Repository.UrlOnly;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface YouTubeVideoRepository extends JpaRepository<YouTubeVideo, String> {
    List<UrlOnly> findAllProjectedBy();
}