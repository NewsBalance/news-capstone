package newsbalance.demo.Entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter @Setter
@Table(name = "youtube_content")
public class YoutubeContent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    private String VideoUrl;
    private Double biasScore;


    @OneToMany(mappedBy = "videoSummary", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SummarySentence> SentencesScore = new ArrayList<>();
}
