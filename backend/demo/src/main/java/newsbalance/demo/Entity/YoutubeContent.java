package newsbalance.demo.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.GenericGenerator;
import org.springframework.data.elasticsearch.annotations.DateFormat;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter @Setter
@Table(name = "youtube_contents")
public class YoutubeContent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String VideoUrl;
    private Double biasScore;

    private LocalDateTime publishedAt;

    @OneToMany(mappedBy = "videoSummary", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SummarySentence> SentencesScore = new ArrayList<>();


}
