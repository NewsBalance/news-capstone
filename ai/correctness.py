import openai
import time
from youtube_transcript_api import YouTubeTranscriptApi
from dotenv import load_dotenv
import os

# 🔐 환경변수 로딩
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
ASSISTANT_ID = os.getenv("ASSISTANT_ID")

# ✅ 자막 추출 함수
def get_transcript(video_url):
    video_id = video_url.split("v=")[-1]
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=["ko", "en"])
        full_text = " ".join([t["text"] for t in transcript])
        return full_text
    except Exception as e:
        print(f"[❌ 자막 오류] {e}")
        return None

# ✅ GPT 어시스턴트 호출 함수 (요약 + 키워드 추출)
def summarize_with_keywords(text):
    thread = openai.beta.threads.create()
    thread_id = thread.id

    openai.beta.threads.messages.create(
        thread_id=thread_id,
        role="user",
        content=text
    )

    run = openai.beta.threads.runs.create(
        thread_id=thread_id,
        assistant_id=ASSISTANT_ID
    )

    while run.status in ["queued", "in_progress"]:
        run = openai.beta.threads.runs.retrieve(thread_id=thread_id, run_id=run.id)
        time.sleep(1)

    messages = openai.beta.threads.messages.list(thread_id=thread_id, order="asc")
    result = messages.data[-1].content[0].text.value
    return result

# ✅ 전체 실행
if __name__ == "__main__":
    youtube_url = "https://www.youtube.com/watch?v=MyHFZlAr3DY"  # 예: ?v=abcd1234
    transcript = get_transcript(youtube_url)
    if transcript:
        print("🎬 유튜브 자막 추출 완료.\n")
        gpt_response = summarize_with_keywords(transcript)
        print("\n🧠 GPT 요약 + 키워드 응답:\n")
        print(gpt_response)
    else:
        print("⚠️ 자막을 불러오지 못했습니다.")
