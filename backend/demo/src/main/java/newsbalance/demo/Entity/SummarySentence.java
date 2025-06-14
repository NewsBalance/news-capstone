package newsbalance.demo.Entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter @Setter
@Table(name = "summary_sentences")
public class SummarySentence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "video_summary_id")
    @JsonBackReference
    private YoutubeContent videoSummary;

    @Column(columnDefinition = "TEXT")
    private String content;

    private Double score;
}
