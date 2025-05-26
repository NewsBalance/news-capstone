package newsbalance.demo.Repository;

import newsbalance.demo.Entity.YoutubeContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface YoutubeContentRepository extends JpaRepository<YoutubeContent, Long> {
}
