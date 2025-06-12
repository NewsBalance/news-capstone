package newsbalance.demo.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MailService {

    private final JavaMailSender javaMailSender;

    @Value("${spring.mail.username}")
    private String senderEmail;

    private final ConcurrentHashMap<String, CodeEntry> codeStorage = new ConcurrentHashMap<>();

    // 인증코드 유효시간 5분
    private static final Duration TIME = Duration.ofMinutes(5);

    // 인증 코드 생성
    private String generateCode() {
        return String.valueOf((int) (Math.random() * 900000) + 100000);
    }

    // 이메일 코드 메일 생성
    public MimeMessage CreateCodeMail(String email, String code) {
        MimeMessage message = javaMailSender.createMimeMessage();

        try {
            message.setFrom(senderEmail);
            message.setRecipients(MimeMessage.RecipientType.TO, email);
            message.setSubject("이메일 인증");
            String body = "";
            body += "<h3>" + "요청하신 인증 번호입니다." + "</h3>";
            body += "<h1>" + code + "</h1>";
            body += "<h3>" + "감사합니다." + "</h3>";
            message.setText(body,"UTF-8", "html");
        } catch (MessagingException e) {
            log.error("메일 생성 실패", e);
            throw new RuntimeException("메일 생성 실패", e);
        }

        return message;
    }

    // 이메일 코드 메일 전송
    public void SendCodeMail(String email) {
        String code = generateCode();
        LocalDateTime expiresAt = LocalDateTime.now().plus(TIME);

        codeStorage.put(email, new CodeEntry(code, expiresAt));

        MimeMessage message = CreateCodeMail(email, code);
        javaMailSender.send(message);

        log.info("인증코드 {} 이메일 {} 로 발송 완료 (만료 : {})", code, email, expiresAt);
    }

    // 인증 코드 검증
    public boolean verifyCode(String email, String inputCode) {
        CodeEntry entry = codeStorage.get(email);
        if (entry == null) {
            return false; // 코드 없음 또는 이미 사용됨
        }

        // 만료 검사
        if (LocalDateTime.now().isAfter(entry.getExpiresAt())) {
            codeStorage.remove(email);
            return false;
        }

        // 코드 일치 여부
        if (entry.getCode().equals(inputCode)) {
            codeStorage.remove(email); // 1회용 제거
            return true;
        }

        return false;
    }

    @AllArgsConstructor
    @Getter
    private static class CodeEntry{
        private final String code;
        private final LocalDateTime expiresAt;
    }

}
