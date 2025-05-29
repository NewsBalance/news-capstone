package newsbalance.demo.Service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import newsbalance.demo.Entity.RelatedArticle;
import newsbalance.demo.Entity.SummarySentence;
import newsbalance.demo.Entity.YoutubeContent;
import newsbalance.demo.Repository.Elasticsearch.YoutubeContentElasticRepository;
import newsbalance.demo.Repository.JPA.YoutubeContentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import newsbalance.demo.DTO.Request.YoutubeContentRequestDTO;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class YoutubeContentService {

    @Autowired
    private YoutubeContentRepository youtubeContentRepository;

    @Autowired
    private YoutubeContentElasticRepository youtubeContentElasticRepository;


    @Transactional
    public void saveContent(YoutubeContentRequestDTO dto, String title, Long publishedAt) {
        YoutubeContent content = new YoutubeContent();
        content.setVideoUrl(dto.getUrl());
        content.setBiasScore(dto.getBiasScore());
        content.setTitle(title);
        content.setPublishedAt(publishedAt * 1_000L);
        content.setKeywords(dto.getKeywords());

        youtubeContentElasticRepository.save(content);

        List<SummarySentence> sentences = dto.getSummarySentences().stream()
                .map(s -> {
                    SummarySentence sentence = new SummarySentence();
                    sentence.setContent(s.getContent());
                    sentence.setScore(s.getScore());
                    sentence.setVideoSummary(content);
                    return sentence;
                })
                .collect(Collectors.toList());
        content.setSentencesScore(sentences);

        List<RelatedArticle> relatedArticles = dto.getRelatedArticles().stream()
                        .map(s -> {
                            RelatedArticle relatedArticle = new RelatedArticle();
                            relatedArticle.setTitle(s.getTitle());
                            relatedArticle.setLink(s.getLink());
                            return relatedArticle;
                        })
                        .toList();
        content.setRelatedArticles(relatedArticles);

        youtubeContentRepository.save(content);
    }

    public Optional<YoutubeContent> getYoutubecontent(String url) {
        return youtubeContentRepository.findByVideoUrl(url);
    }

}
