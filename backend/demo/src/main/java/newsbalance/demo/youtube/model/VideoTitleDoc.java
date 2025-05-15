package newsbalance.demo.youtube.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(indexName = "youtube_titles")
public class VideoTitleDoc {
    @Id
    private String videoId;
    private String title;
}