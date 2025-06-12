package newsbalance.demo.Service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import newsbalance.demo.DTO.UrlContentRequestDTO;
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


        List<SummarySentence> sentences = dto.getSummarySentences().stream()
                .map(s -> {
                    SummarySentence ss = new SummarySentence();
                    ss.setContent(s.getContent());
                    ss.setScore(s.getScore());
                    ss.setVideoSummary(content);
                    return ss;
                })
                .collect(Collectors.toList());
        content.setSentencesScore(sentences);

        List<RelatedArticle> relatedArticles = dto.getRelatedArticles().stream()
                .map(a -> {
                    RelatedArticle ra = new RelatedArticle();
                    ra.setTitle(a.getTitle());
                    ra.setLink(a.getLink());
                    return ra;
                })
                .toList();
        content.setRelatedArticles(relatedArticles);

        // 3. JPA 저장 (ID 발급 및 자식 연관관계 저장)
        YoutubeContent saved = youtubeContentRepository.save(content);

        // 4. Elasticsearch 저장 (초기 save 시점보다 마지막에 호출)
        youtubeContentElasticRepository.save(saved);
    }

    @Transactional
    public void saveUrlContent(UrlContentRequestDTO dto) {
        YoutubeContent content = new YoutubeContent();
        content.setVideoUrl(dto.getUrl());
        content.setBiasScore(dto.getBiasScore());
        content.setTitle(dto.getTitle());

        List<SummarySentence> sentences = dto.getSummarySentences().stream()
                .map(s -> {
                    SummarySentence ss = new SummarySentence();
                    ss.setContent(s.getContent());
                    ss.setScore(s.getScore());
                    ss.setVideoSummary(content);
                    return ss;
                })
                .collect(Collectors.toList());
        content.setSentencesScore(sentences);

        List<RelatedArticle> relatedArticles = dto.getRelatedArticles().stream()
                .map(a -> {
                    RelatedArticle ra = new RelatedArticle();
                    ra.setTitle(a.getTitle());
                    ra.setLink(a.getLink());
                    return ra;
                })
                .toList();
        content.setRelatedArticles(relatedArticles);

        // 3. JPA 저장 (ID 발급 및 자식 연관관계 저장)
        YoutubeContent saved = youtubeContentRepository.save(content);
    }


    public Optional<YoutubeContent> getYoutubecontent(String url) {
        return youtubeContentRepository.findByVideoUrl(url);
    }

}
