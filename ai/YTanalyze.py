from flask import Flask, request, jsonify
import nltk
nltk.download('punkt')

import subprocess
import json
import re
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

def get_transcript(video_url, lang="ko"):
    # video_id 추출
    match = re.search(r"[?&]v=([a-zA-Z0-9_-]{11})", video_url)
    if not match:
        return None, "❌ 유효하지 않은 유튜브 URL 형식입니다."
    video_id = match.group(1)

    try:
        # yt-dlp로 자동 생성 자막 URL 추출
        result = subprocess.run(
            ["yt-dlp", "-J", video_url],
            capture_output=True, text=True, check=True
        )
        video_info = json.loads(result.stdout)
        subtitles = video_info.get("automatic_captions", {})
        if lang not in subtitles:
            return None, f"❌ '{lang}' 언어의 자동 생성 자막이 없습니다."

        subtitle_url = subtitles[lang][0]["url"]

        # json3 자막 그대로 요청
        response = requests.get(subtitle_url)
        if response.status_code != 200:
            return None, "❌ 자막 데이터 요청 실패"

        data = response.json()
        if "events" not in data:
            return None, "❌ 자막 이벤트 데이터가 없습니다."

        texts = []
        for event in data["events"]:
            if "segs" in event:
                seg_text = "".join([seg.get("utf8", "") for seg in event["segs"]])
                texts.append(seg_text.strip())

        full_text = " ".join(texts)
        return full_text, None

    except subprocess.CalledProcessError as e:
        return None, f"❌ yt-dlp 실행 실패: {e}"
    except Exception as e:
        return None, f"❌ 자막 처리 실패: {e}"

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
    transcript, err = get_transcript(url)
    
    if err or not transcript or not isinstance(transcript, str) or transcript.strip() == "":
        return jsonify({"error": err or "자막 추출 실패"}), 400

    try:
        # yt-dlp -J 호출로 메타정보 가져오기
        info_proc = subprocess.run(
            ["yt-dlp", "-J", url],
            capture_output=True, text=True, check=True
        )
        info_json = json.loads(info_proc.stdout)
        video_title = info_json.get("title", "")
    except Exception as e:
        app.logger.warning(f"제목 추출 실패: {e}")
        video_title = ""
        
    try:
        summary = summarize_with_assistant(transcript)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"GPT Assistant 처리 실패: {str(e)}"}), 500
    content_only = summary.split("[KEYWORDS]")[0].strip()
    sentences = sent_tokenize(content_only)
    scores = predict_bias(sentences)
    avg = sum(scores) / len(scores) if scores else 0

    queries = extract_keywords_from_summary(summary)
    related_articles = {kw: search_news_articles(kw) for kw in queries}

    related_articles_result = []
    for articles in related_articles.values():
        for art in articles:
            related_articles_result.append({
                "title": art["title"],
                "link": art["link"]
            })

    result = {
        "url": url,
        "title": video_title,
        "biasScore": avg,
        "summarySentences": [
            {"content": s, "score": b}
            for s, b in zip(sentences, scores)
        ],
        "relatedArticles": related_articles_result,
        "keywords": list({kw_part for kw in queries for kw_part in kw.split("+")})
    }
    return jsonify(result)


#  1. GPT Assistant 토론자 발언 요약 요청
def dabate_summarize_with_assistant(text):
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
        assistant_id=ASSISTANT2_ID
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


#  토론자 발언 요지 요약 엔드포인트
@app.route('/debate/summarize', methods=['POST'])
def dabate_summarize_endpoint():
    data = request.get_json()
    print(">>> 수신 데이터:", data)
    
    # request에서 필요한 데이터 추출
    message = data.get("messages", [])
    combined_message = "\n".join([m.get("text", "") for m in message])
    
    summarize_message = dabate_summarize_with_assistant(combined_message)

    if "[Query]" in summarize_message:
        summarize_message_clean = summarize_message.split("[Query]")[0].strip()
        
    queries = extract_keywords_from_summary(summarize_message)
    related_articles = {kw: search_news_articles(kw) for kw in queries}

    
    related_articles_result = []
    for articles in related_articles.values():  
        for art in articles:
            related_articles_result.append({
                "title": art["title"],
                "link": art["link"]
            })


    # 데이터 반환
    result = {
        "summarizemessage": summarize_message_clean,
        "relatedArticles": related_articles_result,
        "keywords": list({kw_part for kw in queries for kw_part in kw.split("+")})
        
    }
    return jsonify(result)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
    
