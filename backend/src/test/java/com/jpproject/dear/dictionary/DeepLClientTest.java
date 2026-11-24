package com.jpproject.dear.dictionary;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DeepLClientTest {

    @Test
    void 번역_결과의_text를_꺼낸다() {
        String json = "{\"translations\":[{\"detected_source_language\":\"JA\",\"text\":\"친구\"}]}";
        assertEquals("친구", DeepLClient.parse(json));
    }

    @Test
    void 번역이_비어_있으면_빈_문자열() {
        assertEquals("", DeepLClient.parse("{\"translations\":[]}"));
        assertEquals("", DeepLClient.parse("{}"));
    }
}
