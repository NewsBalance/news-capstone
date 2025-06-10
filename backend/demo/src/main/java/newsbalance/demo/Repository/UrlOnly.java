package newsbalance.demo.Repository;

import java.time.LocalDateTime;

public interface UrlOnly {
    String getVideoUrl();
    String getTitle();
    LocalDateTime getPublishedAt();
}
