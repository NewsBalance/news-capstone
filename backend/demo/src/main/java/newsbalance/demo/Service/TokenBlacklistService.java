package newsbalance.demo.Service;

import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class TokenBlacklistService {
    
    // 블랙리스트에 등록된 토큰 저장 (토큰 -> 만료 시간)
    private final Map<String, Long> blacklistedTokens = new ConcurrentHashMap<>();
    
    /**
     * 토큰을 블랙리스트에 추가
     * @param token JWT 토큰
     * @param expiryTimeMillis 토큰 만료 시간 (밀리초)
     */
    public void addToBlacklist(String token, long expiryTimeMillis) {
        blacklistedTokens.put(token, expiryTimeMillis);
        log.debug("토큰이 블랙리스트에 추가됨: {}", token.substring(0, 10) + "...");
        
        // 주기적으로 만료된 토큰 정리 (실제 환경에서는 스케줄러로 구현)
        cleanupExpiredTokens();
    }
    
    /**
     * 토큰이 블랙리스트에 있는지 확인
     * @param token JWT 토큰
     * @return 블랙리스트 포함 여부
     */
    public boolean isBlacklisted(String token) {
        return blacklistedTokens.containsKey(token);
    }
    
    /**
     * 만료된 토큰을 블랙리스트에서 제거
     */
    private void cleanupExpiredTokens() {
        long currentTimeMillis = System.currentTimeMillis();
        
        // 만료된 토큰 제거
        blacklistedTokens.entrySet().removeIf(entry -> entry.getValue() < currentTimeMillis);
        log.debug("만료된 토큰 정리 완료. 현재 블랙리스트 크기: {}", blacklistedTokens.size());
    }
} 