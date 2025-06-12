package newsbalance.demo.Entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
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
@Table(name = "youtube_contents")
@Document(indexName = "youtube_contents")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class YoutubeContent {
    @Id @org.springframework.data.annotation.Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private int id;

    @Field(type = FieldType.Text)
    private String title;

    @Field(type = FieldType.Keyword)
    private String videoUrl;

    @Field(type = FieldType.Double)
    private Double biasScore;

    // publishedAt을 epoch millis(Long)으로 저장
    @Field(type = FieldType.Date, format = {DateFormat.strict_date_optional_time, DateFormat.epoch_millis})
    @Column(name = "published_at")
    private Long publishedAt;

    // 원본 JSON의 "url" 필드
    @Field(type = FieldType.Keyword)
    private String url;

    // 원본 JSON의 "keywords" 배열
    @ElementCollection
    @CollectionTable(
            name = "youtube_keywords",
            joinColumns = @JoinColumn(name = "youtube_content_id")
    )
    @Column(name = "keyword")
    @Field(type = FieldType.Keyword)
    private List<String> keywords = new ArrayList<>();

    // 원본 JSON의 "relatedArticles" 배열
    @ElementCollection
    @CollectionTable(
            name = "related_articles",
            joinColumns = @JoinColumn(name = "youtube_content_id")
    )
    @Field(type = FieldType.Nested, includeInParent = true)
    @org.springframework.data.annotation.Transient
    private List<RelatedArticle> relatedArticles = new ArrayList<>();

    // 기존 summarySentences 매핑
    @OneToMany(mappedBy = "videoSummary", cascade = CascadeType.ALL, orphanRemoval = true)
    @Field(type = FieldType.Nested, includeInParent = true)
    @JsonManagedReference
    @org.springframework.data.annotation.Transient
    private List<SummarySentence> sentencesScore = new ArrayList<>();



}
