package com.jpproject.dear.dictionary;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * 한국어기초사전 Open API 호출. 한국어 단어를 보내면 일본어 번역을 돌려준다. (한국어 → 일본어 방향만 가능)
 * 실패하면 예외를 던지고, 서비스가 잡아서 DB 사전으로 대신한다.
 */
@Component
public class KrdictClient {

    private static final String TRANS_LANG_JAPANESE = "2";

    private final String apiKey;
    private final String baseUrl;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build();

    public KrdictClient(@Value("${krdict.api-key:}") String apiKey,
                        @Value("${krdict.base-url}") String baseUrl) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }

    /** 키가 설정돼 있는지 (없으면 서비스가 DB 사전만 쓴다) */
    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    /** 한국어 단어로 검색 → Item(term=일본어, reading=읽기, meaning=한국어) 목록 */
    public List<DictionaryResponse.Item> searchKorean(String q) throws Exception {
        String url = baseUrl
                + "?key=" + enc(apiKey)
                + "&q=" + enc(q)
                + "&part=word&sort=popular&num=10"          // num 은 최소 10
                + "&translated=y&trans_lang=" + TRANS_LANG_JAPANESE;
        HttpRequest request = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(4)).GET().build();
        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() != 200) {
            throw new IllegalStateException("krdict HTTP " + response.statusCode());
        }
        return parse(response.body());
    }

    /** API가 주는 XML → Item 목록. 일본어 번역이 없는 단어는 건너뛴다. */
    static List<DictionaryResponse.Item> parse(String xml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true); // 외부 엔티티 공격 방지
        factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
        Document doc = factory.newDocumentBuilder().parse(new InputSource(new StringReader(xml)));

        Element root = doc.getDocumentElement();
        if ("error".equals(root.getTagName())) {
            throw new IllegalStateException("krdict error " + text(root, "error_code"));
        }

        List<DictionaryResponse.Item> items = new ArrayList<>();
        NodeList itemNodes = root.getElementsByTagName("item");
        for (int i = 0; i < itemNodes.getLength(); i++) {
            Element item = (Element) itemNodes.item(i);
            String korean = text(item, "word");
            String transWord = text(item, "trans_word");   // 첫 번째 뜻의 번역만 사용
            if (korean.isEmpty() || transWord.isEmpty()) continue;
            DictionaryResponse.Item next = toItem(korean, transWord);
            if (!items.contains(next)) {          // 동음이의어로 같은 항목이 두 번 오는 경우 제거
                items.add(next);
            }
        }
        return items;
    }

    /**
     * "きょう【今日】。ほんじつ【本日】" → term=今日, reading=きょう (첫 번째 표현만).
     * 【】가 없으면(예: 가타카나 단어) 통째로 term 으로 쓴다.
     */
    static DictionaryResponse.Item toItem(String korean, String transWord) {
        String first = transWord.split("。")[0].trim();
        int open = first.indexOf('【');
        int close = first.indexOf('】');
        if (open > 0 && close > open) {
            String reading = first.substring(0, open).trim();
            String term = first.substring(open + 1, close).trim();
            return new DictionaryResponse.Item(term, reading, korean);
        }
        return new DictionaryResponse.Item(first, null, korean);
    }

    /** 태그 이름으로 첫 번째 글자값 찾기 (없으면 빈 문자열) */
    private static String text(Element parent, String tag) {
        NodeList nodes = parent.getElementsByTagName(tag);
        if (nodes.getLength() == 0) return "";
        Node node = nodes.item(0);
        return node.getTextContent() == null ? "" : node.getTextContent().trim();
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
