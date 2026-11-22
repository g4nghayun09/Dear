package com.jpproject.dear.config;

import com.jpproject.dear.login.LoginInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final LoginInterceptor loginInterceptor;

    public WebConfig(LoginInterceptor loginInterceptor) {
        this.loginInterceptor = loginInterceptor;
    }

    // 로그인이 필요한 경로. 일기(/diaries) 등 기능을 만들 때 여기에 추가한다.
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(loginInterceptor)
                .addPathPatterns("/users/me", "/users/me/**");
    }

    // 웹(Expo web)에서 개발할 때 다른 주소(localhost:8081)에서 호출할 수 있게 허용.
    // 쿠키를 쓰지 않고 Bearer 토큰만 쓰므로 모든 출처를 열어도 된다. todo: 배포 시 도메인으로 제한
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
