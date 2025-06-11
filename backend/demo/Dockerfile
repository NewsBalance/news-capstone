# Build stage

FROM bellsoft/liberica-openjdk-alpine:17 AS builder

WORKDIR /backend

COPY . .

RUN chmod +x ./gradlew

RUN ./gradlew clean build -x test


# Run stage

FROM bellsoft/liberica-openjdk-alpine:17

WORKDIR /backend

COPY --from=builder /backend/build/libs/*.jar backend.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","backend.jar"]
