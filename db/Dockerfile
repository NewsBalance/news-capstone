FROM postgres:17

ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=1q2w3e4r
ENV POSTGRES_DB=capstone

# 복원용 스크립트와 덤프 복사
COPY ./capstone.dump /docker-entrypoint-initdb.d/capstone.dump
COPY ./restore.sh /docker-entrypoint-initdb.d/restore.sh

RUN chmod +x /docker-entrypoint-initdb.d/restore.sh
