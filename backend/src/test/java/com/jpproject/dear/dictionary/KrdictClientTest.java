package com.jpproject.dear.dictionary;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class KrdictClientTest {

    private static final String SAMPLE = """
            <?xml version="1.0" encoding="UTF-8"?>
            <channel>
              <total>2</total>
              <item>
                <word>오늘</word>
                <sense>
                  <definition>지금 지나가고 있는 이날.</definition>
                  <translation>
                    <trans_lang>일본어</trans_lang>
                    <trans_word><![CDATA[きょう【今日】。ほんじつ【本日】]]></trans_word>
                  </translation>
                </sense>
                <sense>
                  <translation><trans_word><![CDATA[こんにち【今日】]]></trans_word></translation>
                </sense>
              </item>
              <item>
                <word>컴퓨터</word>
                <sense><translation><trans_word><![CDATA[コンピューター]]></trans_word></translation></sense>
              </item>
              <item>
                <word>번역없음</word>
                <sense><definition>번역이 없는 단어</definition></sense>
              </item>
            </channel>
            """;

    @Test
    void 읽기와_한자를_나누고_첫_번째_뜻만_쓴다() throws Exception {
        List<DictionaryResponse.Item> items = KrdictClient.parse(SAMPLE);
        assertEquals(2, items.size());                       // 번역 없는 단어는 제외
        assertEquals(new DictionaryResponse.Item("今日", "きょう", "오늘"), items.get(0));
    }

    @Test
    void 대괄호가_없으면_통째로_term() throws Exception {
        DictionaryResponse.Item item = KrdictClient.parse(SAMPLE).get(1);
        assertEquals("コンピューター", item.term());
        assertNull(item.reading());
        assertEquals("컴퓨터", item.meaning());
    }

    @Test
    void 에러_응답은_예외() {
        String error = "<?xml version=\"1.0\"?><error><error_code>101</error_code><message>x</message></error>";
        assertThrows(IllegalStateException.class, () -> KrdictClient.parse(error));
    }

    @Test
    void 결과가_없으면_빈_목록() throws Exception {
        assertTrue(KrdictClient.parse("<channel><total>0</total></channel>").isEmpty());
    }
}
