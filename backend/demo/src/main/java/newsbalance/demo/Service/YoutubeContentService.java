package newsbalance.demo.Service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import newsbalance.demo.Entity.SummarySentence;
import newsbalance.demo.Entity.VideoTitleDoc;
import newsbalance.demo.Entity.YoutubeContent;
import newsbalance.demo.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import newsbalance.demo.DTO.Request.YoutubeContentRequestDTO;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class YoutubeContentService {

    @Autowired
    private YoutubeContentRepository youtubeContentRepository;

    @Autowired
    private YoutubeContentElasticRepository youtubeContentElasticRepository;


    @Transactional
    public void saveContent(YoutubeContentRequestDTO dto) {
        YoutubeContent content = new YoutubeContent();
        content.setVideoUrl(dto.getUrl());
        content.setBiasScore(dto.getBiasScore());

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
//        youtubeContentElasticRepository.save(content);
    }



}
