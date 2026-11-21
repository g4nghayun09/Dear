package com.jpproject.dear.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * [임시] 로그인(JWT) 기능이 붙기 전까지 쓰는 보안 설정. (작성: 강태인)
 *
 * spring-boot-starter-security가 들어 있으면 기본으로 모든 API가 막히기 때문에,
 * 매칭 등 다른 기능을 테스트할 수 있게 잠시 열어 둡니다.
 * 사용자 구분은 개발용 X-User-Id 헤더(DevUserIdFilter, DEV_AUTH=true)로 합니다.
 *
 * ▶ 로그인 담당(강하윤): JWT 필터를 넣은 SecurityConfig를 만들면 이 파일은 지워 주세요.
 *   (SecurityFilterChain이 두 개 있으면 서버가 켜지지 않습니다)
 */
@Configuration
public class TempSecurityConfig {

    @Bean
    public SecurityFilterChain tempSecurityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        return http.build();
    }
}
