package com.example.youtube;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;

@SpringBootApplication
@EnableElasticsearchRepositories(basePackages = "com.example.youtube.repository")

public class YouTubeNotifierApplication {
    public static void main(String[] args) {
        SpringApplication.run(YouTubeNotifierApplication.class, args);
    }
}