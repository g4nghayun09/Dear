package com.jpproject.dear.dictionary;

import java.util.List;

public record DictionaryResponse(List<Item> results) {
    // pos: 품사 (명사/동사/형용사 등). 모르면(DeepL 번역 등) null
    public record Item(String term, String reading, String meaning, String pos) {}
}
