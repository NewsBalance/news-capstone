package newsbalance.demo.Entity;

import java.time.LocalDateTime;


public record VideoInfo(
        String videoUrl,
        String title,
        Long publishedAt
) {
}
