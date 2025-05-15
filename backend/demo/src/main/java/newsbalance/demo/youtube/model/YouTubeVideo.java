package newsbalance.demo.youtube.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.time.LocalDateTime;

@Data
@Entity
@NoArgsConstructor
@Table(name = "youtube_videos")
public class YouTubeVideo {
    // PostgreSQL에 저장될 유튜브 영상 정보

    @Id
    private String videoId;

    private String title;
    private LocalDateTime publishedAt;
    private String videoUrl;

    @Column(columnDefinition = "TEXT")
    private String caption;
}