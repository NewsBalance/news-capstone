package com.example.youtube.repository;

import com.example.youtube.model.YouTubeVideo;
import org.springframework.data.jpa.repository.JpaRepository;

public interface YouTubeVideoRepository extends JpaRepository<YouTubeVideo, String> {}