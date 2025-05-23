#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from youtube_transcript_api import YouTubeTranscriptApi
import nltk
nltk.download('punkt')

# ✅ Step 1: 유튜브 자막 가져오기
def get_transcript(video_url):
    video_id = video_url.split("v=")[-1]
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['ko'])
        full_text = " ".join([t["text"] for t in transcript])
        return full_text
    except Exception as e:
        print(f"[오류] 자막 추출 실패: {e}")
        return None



# ✅ Step 3: 전체 실행
def text_youtube(video_url):
    text = get_transcript(video_url)
    if text:
        print(text)  # 전체 자막 출력

# ✅ 사용 예시
# %%
youtube_url = "https://www.youtube.com/watch?v=nWDmf3BvoOw"

text_youtube(youtube_url)