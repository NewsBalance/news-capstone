//package newsbalance.demo.Configuration;
//
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.security.authentication.AuthenticationManager;
//import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
//import org.springframework.security.config.annotation.web.builders.HttpSecurity;
//import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
//import org.springframework.security.config.http.SessionCreationPolicy;
//import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.security.web.SecurityFilterChain;
//import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
//import org.springframework.security.web.context.SecurityContextRepository;
//
//import org.springframework.web.cors.CorsConfiguration;
//import org.springframework.web.cors.CorsConfigurationSource;
//import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
//
//import java.util.Arrays;
//
//@Configuration
//@EnableWebSecurity
//@Slf4j
//public class SecurityConfig {
//
//    public SecurityConfig() {
//    }
//
////    @Bean
////    public PasswordEncoder passwordEncoder() {
////        return new BCryptPasswordEncoder();
////    }
//
////    @Bean
////    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
////        http
////                .csrf(csrf -> csrf.disable())
////                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
////                .sessionManagement(session -> session
////                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED) // 세션 인증 유지
////                )
////                .securityContext(securityContext -> securityContext
////                        .securityContextRepository(securityContextRepository()) // 세션 저장소 설정
////                )
////                .authorizeHttpRequests(auth -> auth
////                        .requestMatchers(
////                                "/session/login",
////                                "/api/login",
////                                "/Login/login",
////                                "/api/register",
////                                "/Register/register",
////                                "/h2-console/**",
////                                "/api/public/**",
////                                "/session/my"
////                        ).permitAll()
////                        .anyRequest().authenticated()
////                )
////                .formLogin(form -> form.disable()) // 로그인 폼 완전히 비활성화
////                .logout(logout -> logout
////                        .logoutUrl("/session/logout")
////                        .invalidateHttpSession(true)
////                        .clearAuthentication(true)
////                        .permitAll()
////                );
////
////        return http.build();
////    }
//
////    @Bean
////    public SecurityContextRepository securityContextRepository() {
////        return new HttpSessionSecurityContextRepository();
////    }
//
////    @Bean
////    public CorsConfigurationSource corsConfigurationSource() {
////        CorsConfiguration configuration = new CorsConfiguration();
////        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
////        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
////        configuration.setAllowedHeaders(Arrays.asList(
////                "Authorization", "Cache-Control", "Content-Type", "Accept", "X-Requested-With"
////        ));
////        configuration.setAllowCredentials(true); // 쿠키 주고받기 허용
////        configuration.setExposedHeaders(Arrays.asList("Set-Cookie"));
////
////        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
////        source.registerCorsConfiguration("/**", configuration);
////        return source;
////    }
////
////    @Bean
////    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
////        return authConfig.getAuthenticationManager();
////    }
//
//}