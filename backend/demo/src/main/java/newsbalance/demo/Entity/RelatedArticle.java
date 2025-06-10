package newsbalance.demo.Entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

@Embeddable
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class RelatedArticle {
    @Column(name = "article_link")
    @Field(type = FieldType.Keyword)
    private String link;

    @Column(name = "article_title")
    @Field(type = FieldType.Text)
    private String title;
}
