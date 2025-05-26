package newsbalance.demo.Config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import newsbalance.demo.Configuration.SessionConst;

@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    
    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String path = request.getRequestURI();
        log.debug("JwtAuthenticationFilter: Processing request for path: {}", path);
        
        try {
            // 세션이 이미 있는지 확인
            if (request.getSession(false) != null && 
                request.getSession().getAttribute(SessionConst.Login_email) != null) {
                log.debug("JwtAuthenticationFilter: Session already exists for user: {}", 
                        request.getSession().getAttribute(SessionConst.Login_email));
                filterChain.doFilter(request, response);
                return;
            }
            
            // 공개 엔드포인트는 토큰 검증 없이 통과
            if (isPublicEndpoint(path)) {
                log.debug("JwtAuthenticationFilter: Skipping token validation for public endpoint: {}", path);
                filterChain.doFilter(request, response);
                return;
            }
            
            String token = jwtTokenProvider.resolveToken(request);
            log.debug("JwtAuthenticationFilter: Resolved token: {}", token != null ? "exists" : "null");
            
            if (token != null && jwtTokenProvider.validateToken(token)) {
                Authentication auth = jwtTokenProvider.getAuthentication(token);
                SecurityContextHolder.getContext().setAuthentication(auth);
                
                // JWT 인증 성공 시 세션에 사용자 정보 저장
                String username = jwtTokenProvider.getUsername(token);
                request.getSession().setAttribute(SessionConst.Login_email, username);
                
                log.debug("JwtAuthenticationFilter: Authentication set for user: {}", 
                        auth.getName());
            } else {
                log.debug("JwtAuthenticationFilter: No valid token found");
            }
            
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            log.error("JwtAuthenticationFilter: Error processing request", e);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Authentication error: " + e.getMessage());
        }
    }
    
    private boolean isPublicEndpoint(String path) {
        return path.startsWith("/api/login") || 
               path.startsWith("/api/register") || 
               path.startsWith("/user/regi") ||
               path.startsWith("/user/checkemail") ||
               path.startsWith("/user/sendcode") ||
               path.startsWith("/user/verifycode") ||
               path.startsWith("/Login/login") ||
               path.startsWith("/Register") ||
               path.startsWith("/h2-console") ||
               path.startsWith("/api/public");
    }
} 