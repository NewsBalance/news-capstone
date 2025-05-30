package newsbalance.demo.Service;

import org.json.JSONObject;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class OpenAiService {

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
    private static final String API_KEY = "OPENAI API KEY"; // OpenAI API Key, 실제로 키를 여기에 추가

    public String factCheck(String message) {
        RestTemplate restTemplate = new RestTemplate();

        // GPT-4 모델을 사용한 팩트체크 요청을 보낼 프롬프트 설정
        String prompt = "Fact check the following statement and rate the validity: '" + message + "'." +
                " Respond with one of the following: " +
                "'Sufficient evidence for this statement.', " +
                "'Can be argued depending on perspective.', " +
                "'Insufficient evidence to support this statement.'";

        // OpenAI API에 보낼 요청 페이로드 작성 (GPT-4 모델 사용)
        String requestPayload = "{ " +
                "\"model\": \"gpt-4\", " + // GPT-4 모델 사용
                "\"messages\": [{ \"role\": \"system\", \"content\": \"You are a helpful assistant.\" }, " +
                "{ \"role\": \"user\", \"content\": \"" + prompt.replace("\"", "\\\"") + "\" }], " +
                "\"max_tokens\": 100 " +
                "}";

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + API_KEY);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>(requestPayload, headers);

        try {
            // API 요청 보내기
            ResponseEntity<String> response = restTemplate.exchange(OPENAI_API_URL, HttpMethod.POST, entity, String.class);

            // 응답 처리
            JSONObject jsonResponse = new JSONObject(response.getBody());

            // GPT 응답에서 결과 텍스트 추출
            String gptResponse = jsonResponse.getJSONArray("choices")
                    .getJSONObject(0)
                    .getJSONObject("message")
                    .getString("content")
                    .trim();

            // GPT 응답 반환
            return gptResponse;
        } catch (Exception e) {
            // 예외가 발생했을 경우 로그 추가
            System.err.println("OpenAI API 요청 중 오류 발생: " + e.getMessage());
            e.printStackTrace(); // 자세한 스택 트레이스 출력
            return "팩트체크 실패: 서버 오류가 발생했습니다"; // 사용자에게 보여줄 간단한 메시지
        }
    }
}
