from flask import Flask, request, jsonify
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
ASSISTANT2_ID = os.getenv("ASSISTANT2_ID")
NAVER_CLIENT_ID = os.getenv("NAVER_CLIENT_ID")
NAVER_CLIENT_SECRET = os.getenv("NAVER_CLIENT_SECRET")

TRUSTED_SOURCES = ["chosun", "hani", "khan", "donga", "joongang", "mbn", "sbs", "ytn", "kbs", "mbc", "jtbc", "ohmynews", "newsis", "yna", "hankookilbo"]



# 모델 로드
MODEL_PATH = "./model/kcbert_second_model"
model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model.to(device)

app = Flask(__name__)


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
        "sort": "sim"
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
    elif "[Query]" in summary_text:
        parts = summary_text.split("[Query]")
        keyword_block = parts[-1].strip()
        queries= [kw.strip() for kw in keyword_block.split(",") if kw.strip()]
        return queries
    return []


#  유튜브 컨텐츠 요약 엔드포인트
@app.route('/summarize', methods=['POST'])
def summarize_endpoint():
    data = request.get_json()
    url = data.get("url")
    transcript = get_transcript(url)

    # 첫 번째 시도 실패 시 재시도
    if not transcript:
        transcript = get_transcript(url)
    
    # 여전히 실패하면 에러 반환
    if not transcript:
        return jsonify({"error": "자막 추출 실패"}), 400

    summary = summarize_with_assistant(transcript)
    content_only = summary.split("[KEYWORDS]")[0].strip()
    sentences = sent_tokenize(content_only)
    scores = predict_bias(sentences)
    avg = sum(scores) / len(scores) if scores else 0

    queries = extract_keywords_from_summary(summary)
    related_articles = {kw: search_news_articles(kw) for kw in queries}

    # 쿼리별 뉴스 기사 딕셔너리 구성
    related_articles_result = []
    for articles in related_articles.values():  # 딕셔너리의 값만 가져옴
        for art in articles:
            related_articles_result.append({
                "title": art["title"],
                "link": art["link"]
            })

    result = {
        "url": url,
        "biasScore": avg,
        "summarySentences": [
            {"content": s, "score": b}
            for s, b in zip(sentences, scores)
            
        ],
        "relatedArticles": related_articles_result,
        "keywords": list({kw_part for kw in queries for kw_part in kw.split("+")})
        
    }
    return jsonify(result)


# 1. GPT Assistant 토론자 발언 요약 요청
def dabate_summarize_with_assistant(text):
    thread = openai.beta.threads.create()
    thread_id = thread.id

    openai.beta.threads.messages.create(
        thread_id=thread_id,
        role="user",
        content=text
    )

    run = openai.beta.threads.runs.create(
        thread_id=thread_id,
        assistant_id=ASSISTANT2_ID
    )

    while run.status in ["queued", "in_progress"]:
        run = openai.beta.threads.runs.retrieve(
            thread_id=thread_id,
            run_id=run.id,
        )
        time.sleep(1)

    messages = openai.beta.threads.messages.list(thread_id=thread_id, order="asc")
    result = messages.data[-1].content[0].text.value
    return result


# 2. 토론자 발언 요약 API
@app.route('/debate/summarize', methods=['POST'])
def dabate_summarize_endpoint():
    data = request.get_json()
    print(">>> 수신 데이터:", data)

    # request에서 단일 메시지 추출
    message = data.get("messages", {})
    combined_message = message.get("text", "")  # 단일 메시지 처리

    summarize_message = dabate_summarize_with_assistant(combined_message)

    # [Query] 태그 이후 제거
    if "[Query]" in summarize_message:
        summarize_message_clean = summarize_message.split("[Query]")[0].strip()
    else:
        summarize_message_clean = summarize_message.strip()

    # 키워드 추출
    queries = extract_keywords_from_summary(summarize_message)
    related_articles = {kw: search_news_articles(kw) for kw in queries}

    # 기사 결과 정리
    related_articles_result = []
    for articles in related_articles.values():
        for art in articles:
            related_articles_result.append({
                "title": art["title"],
                "link": art["link"]
            })

    # 응답 반환
    result = {
        "summarizemessage": summarize_message_clean,
        "relatedArticles": related_articles_result,
        "keywords": list({kw_part for kw in queries for kw_part in kw.split("+")})
    }

    return jsonify(result)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
    