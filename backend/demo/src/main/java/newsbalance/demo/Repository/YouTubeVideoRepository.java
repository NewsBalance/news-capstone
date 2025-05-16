package newsbalance.demo.Repository;

import newsbalance.demo.Entity.YouTubeVideo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface YouTubeVideoRepository extends JpaRepository<YouTubeVideo, String> {}