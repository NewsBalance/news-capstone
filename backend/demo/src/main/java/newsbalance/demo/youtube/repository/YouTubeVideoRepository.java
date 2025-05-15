package newsbalance.demo.youtube.repository;

import newsbalance.demo.youtube.model.YouTubeVideo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface YouTubeVideoRepository extends JpaRepository<YouTubeVideo, String> {}