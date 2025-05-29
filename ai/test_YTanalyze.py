import nltk
nltk.download('punkt')

from youtube_transcript_api import YouTubeTranscriptApi
import nltk, openai, time, torch
from nltk.tokenize import sent_tokenize
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import requests

from dotenv import load_dotenv
import os
load_dotenv()

# Setup
nltk.download("punkt")
openai.api_key = os.getenv("OPENAI_API_KEY")
ASSISTANT_ID = os.getenv("ASSISTANT_ID")
NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET")

TRUSTED_SOURCES = ["chosun", "hani", "khan", "donga", "joongang", "mbn", "sbs", "ytn", "kbs", "mbc", "jtbc", "ohmynews", "newsis", "yna", "hankookilbo"]

# 모델 로드
MODEL_PATH = "./model/kcbert_final_model"
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

#  1. 유튜브 자막 추출
def get_transcript(video_url):
    video_id = video_url.split("v=")[-1]
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=["ko", "en"])
        return " ".join([t["text"] for t in transcript])
    except Exception as e:
        print(f"[ 자막 오류] {e}")
        return None

#  2. GPT Assistant 요약 요청
def summarize_with_assistant(text):
    # 1. Thread 생성
    thread = openai.beta.threads.create()
    thread_id = thread.id

    # 2. 메시지 전송 및 Assistant 실행
    openai.beta.threads.messages.create(
        thread_id=thread_id,
        role="user",
        content=text
    )
    run = openai.beta.threads.runs.create(
        thread_id=thread_id,
        assistant_id=ASSISTANT_ID
    )

    # 3. 실행 상태 대기
    while run.status in ["queued", "in_progress"]:
        run = openai.beta.threads.runs.retrieve(
            thread_id=thread_id,
            run_id=run.id,
        )
        time.sleep(1)

    # 4. 결과 메시지 받아오기
    messages = openai.beta.threads.messages.list(thread_id=thread_id, order="asc")
    result = messages.data[-1].content[0].text.value
    return result

#  3. 정치성향 예측
def predict_bias(sentences):
    inputs = tokenizer(sentences, return_tensors="pt", padding=True, truncation=True, max_length=128).to(device)
    with torch.no_grad():
        outputs = model(**inputs)
        preds = torch.argmax(outputs.logits, dim=1).cpu().tolist()
    reverse_map = {0: -2, 1: -1, 2: 0, 3: 1, 4: 2}
    return [reverse_map[p] for p in preds]

# 4.  관련 기사 검색
def search_news_articles(keyword, max_articles=3):
    url = "https://openapi.naver.com/v1/search/news.json"
    headers = {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    }
    params = {
        "query": keyword,
        "display": 10,
        "sort": "date"
    }
    response = requests.get(url, headers=headers, params=params)
    results = []
    if response.status_code == 200:
        items = response.json().get("items", [])
        for item in items:
            # 🔻 여기 수정된 부분: 필터링 없이 모두 포함
            results.append({
                "title": item.get("title"),
                "link": item.get("link")
            })
            if len(results) >= max_articles:
                break
    return results



def extract_keywords_from_summary(summary_text):
    if "[KEYWORDS]" in summary_text:
        parts = summary_text.split("[KEYWORDS]")
        keyword_block = parts[-1].strip()
        queries= [kw.strip() for kw in keyword_block.split(",") if kw.strip()]
        return queries
    return []




#   전체 흐름 통합
def analyze_youtube_political_bias(url):
    print(f"\n 유튜브 처리 중: {url}")
    transcript = get_transcript(url)
    if not transcript:
        print("자막이 없거나 추출 실패.")
        return

    print(" GPT Assistant에게 요약 요청 중...")
    summary = summarize_with_assistant(transcript)
    print("\n 요약 결과:\n", summary)

    content_only = summary.split("[KEYWORDS]")[0].strip()
    sentences = sent_tokenize(content_only)
    print(f"\n총 {len(sentences)}개의 문장을 분석합니다...")


    bias_scores = predict_bias(sentences)
    for s, b in zip(sentences, bias_scores):
        print(f"[{b:+}] {s}")

    avg = round(sum(bias_scores) / len(bias_scores), 3)
    print(f"\n 평균 정치 편향도: {avg:+}")

    queries = extract_keywords_from_summary(summary)
    related_articles = {kw: search_news_articles(kw) for kw in queries}

    print("\n 키워드별 관련 뉴스 기사:")
    for kw, articles in related_articles.items():
        print(f"\n{kw}:")
        for art in articles:
            print(f"- {art['title']}\n  {art['link']}")



# 사용
if __name__ == "__main__":
    youtube_url = "https://www.youtube.com/watch?v=H52SDhRpH5A"
    analyze_youtube_political_bias(youtube_url)
