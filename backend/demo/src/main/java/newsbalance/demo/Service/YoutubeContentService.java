package newsbalance.demo.Service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import newsbalance.demo.Entity.SummarySentence;
import newsbalance.demo.Entity.YoutubeContent;
import newsbalance.demo.Entity.YoutubeContentElastic;
import newsbalance.demo.Repository.Elasticsearch.YoutubeContentElasticRepository;
import newsbalance.demo.Repository.JPA.YoutubeContentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import newsbalance.demo.DTO.Request.YoutubeContentRequestDTO;

import java.time.LocalDateTime;
import java.util.List;
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
    public void saveContent(YoutubeContentRequestDTO dto, String title, LocalDateTime publishedAt) {
        YoutubeContent content = new YoutubeContent();
        content.setVideoUrl(dto.getUrl());
        content.setBiasScore(dto.getBiasScore());
        content.setTitle(title);
        content.setPublishedAt(publishedAt);

        YoutubeContentElastic contentElastic = new YoutubeContentElastic();
        contentElastic.setId(UUID.randomUUID().toString());
        contentElastic.setVideoUrl(dto.getUrl());
        contentElastic.setBiasScore(dto.getBiasScore());
        contentElastic.setTitle(title);

        youtubeContentElasticRepository.save(contentElastic);

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
        youtubeContentRepository.save(content);
    }


}
