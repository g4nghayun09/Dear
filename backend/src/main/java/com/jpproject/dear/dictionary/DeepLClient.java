package com.jpproject.dear.dictionary;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * DeepL 번역 API 호출 (일본어 → 한국어). 일본어로 사전을 검색할 때 쓴다.
 * 사전이 아니라 번역기라서 단어의 대표 뜻 하나만 돌려준다.
 * 실패하면 예외를 던지고, 서비스가 잡아서 DB 사전 결과(없으면 빈 결과)로 대신한다.
 */
@Component
public class DeepLClient {

    private static final JsonMapper JSON = JsonMapper.builder().build();

    private final String apiKey;
    private final String baseUrl;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();

    public DeepLClient(@Value("${deepl.api-key:}") String apiKey,
                       @Value("${deepl.base-url}") String baseUrl) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.baseUrl = baseUrl;
    }

    /** 키가 설정돼 있는지 (없으면 서비스가 DB 사전만 쓴다) */
    public boolean isEnabled() {
        return !apiKey.isBlank();
    }

    /** 일본어 → 한국어. 번역 결과가 없으면 빈 문자열 */
    public String translateJaToKo(String text) throws Exception {
        String body = JSON.writeValueAsString(Map.of(
                "text", List.of(text),
                "source_lang", "JA",
                "target_lang", "KO"));
        HttpRequest request = HttpRequest.newBuilder(URI.create(baseUrl))
                .timeout(Duration.ofSeconds(5))
                .header("Authorization", "DeepL-Auth-Key " + apiKey)   // 키는 로그에 남기지 않는다
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() != 200) {
            throw new IllegalStateException("deepl HTTP " + response.statusCode());
        }
        return parse(response.body());
    }

    /** {"translations":[{"text":"친구", ...}]} → "친구" */
    static String parse(String json) {
        JsonNode first = JSON.readTree(json).path("translations").path(0);
        return first.path("text").asString("").trim();
    }
}
