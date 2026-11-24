package com.jpproject.dear.dictionary;

import java.util.List;

public record DictionaryResponse(List<Item> results) {
    public record Item(String term, String reading, String meaning) {}
}
