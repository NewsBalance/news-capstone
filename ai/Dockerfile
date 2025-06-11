# 1. 베이스 이미지
FROM python:3.10-slim

# 2. 작업 디렉토리 생성
WORKDIR /app

# 3. 시스템 필수 패키지 설치
RUN apt-get update && apt-get install -y \
    git \
    curl \
    ffmpeg \
    yt-dlp \
    && rm -rf /var/lib/apt/lists/*

# 4. 필요한 Python 패키지 복사 및 설치
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 5. 모델 및 애플리케이션 코드 복사
COPY . .

# 6. 모델 디렉토리 사전 로딩 (kcbert_second_model)
# 사전 학습된 모델이 ./model/kcbert_second_model 에 있다고 가정
# 이 모델 폴더는 docker build 전에 반드시 존재해야 함

# 7. 환경변수 파일 로딩 (.env)
# 이건 docker run 시점에 --env-file 옵션으로 주입 (또는 docker-compose에서 지정)

# 8. Flask 실행
CMD ["python", "YTanalyze.py"]
