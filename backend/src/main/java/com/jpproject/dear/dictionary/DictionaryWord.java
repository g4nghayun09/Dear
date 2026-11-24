package com.jpproject.dear.dictionary;


import jakarta.persistence.*;
import lombok.Getter;

@Getter
@Entity
@Table(name = "dictionary")
public class DictionaryWord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "dictionary_id")
    private Long id;

    @Column(name = "japan_language", nullable = false, length = 100)
    private String japanLanguage;

    @Column(length = 100)
    private String reading;

    @Column(name = "korea_language", nullable = false, length = 100)
    private String koreaLanguage;

    @Column(name = "part_of_speech", length = 10)
    private String partOfSpeech;

    protected DictionaryWord() {}
    // getter 4개 (getJapanLanguage, getReading, getKoreaLanguage, getPartOfSpeech)

}