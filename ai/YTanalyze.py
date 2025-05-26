from flask import Flask, request, jsonify
import nltk
nltk.download('punkt')

from youtube_transcript_api import YouTubeTranscriptApi
import nltk, openai, time, torch
from nltk.tokenize import sent_tokenize
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from dotenv import load_dotenv
import os

load_dotenv()

# Setup
nltk.download("punkt")
openai.api_key = os.getenv("OPENAI_API_KEY")
ASSISTANT_ID = os.getenv("ASSISTANT_ID")

# 모델 로드
MODEL_PATH = "./model/kcbert_final_model"
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

#  엔드포인트
@app.route('/summarize', methods=['POST'])
def summarize_endpoint():
    data = request.get_json()
    url = data.get("url")
    transcript = get_transcript(url)
    if not transcript:
        return jsonify({"error":"자막 추출 실패"}), 400

    summary = summarize_with_assistant(transcript)
    sentences = sent_tokenize(summary)
    scores = predict_bias(sentences)
    avg = sum(scores) / len(scores) if scores else 0

    result = {
        "url": url,
        "biasScore": avg,
        "summarySentences": [
            {"content": s, "score": b}
            for s, b in zip(sentences, scores)
        ]
    }
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
