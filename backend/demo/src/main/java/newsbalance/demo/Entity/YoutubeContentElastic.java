package newsbalance.demo.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.*;

import java.time.LocalDateTime;


@Entity
@Getter @Setter
@Document(indexName = "youtube_contents")
public class YoutubeContentElastic {
    @Id @jakarta.persistence.Id
    private String id;

    @MultiField(
            mainField = @Field(type = FieldType.Text),
            otherFields = {
                    @InnerField(suffix = "keyword", type = FieldType.Keyword)
            }
    )
    private String title;

    private String videoUrl;
    private Double biasScore;

    @Field(type = FieldType.Date, format = {DateFormat.date_time})
    private LocalDateTime publishedAt;


}
