package newsbalance.demo.Repository.JPA;

import newsbalance.demo.Entity.SummarySentence;
import newsbalance.demo.Entity.YoutubeContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import javax.swing.text.html.Option;
import java.util.List;
import java.util.Optional;

@Repository
public interface YoutubeContentRepository extends JpaRepository<YoutubeContent, Integer> {
    Optional<YoutubeContent> findByVideoUrl(String url);
}
