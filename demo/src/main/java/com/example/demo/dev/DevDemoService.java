package com.example.demo.dev;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;

/**
 * [개발용] 시연 화면에서 쓰는 테스트 사용자 준비·초기화.
 * 테스트 사용자 3명(이메일로 구분)만 건드리고, 다른 사용자 데이터는 지우지 않습니다.
 */
@Service
@RequiredArgsConstructor
public class DevDemoService {

    private final EntityManager em;

    public record TestUser(Long userId, String nickname, String nativeLang, String email) {
    }

    private static final List<String[]> TEST_USERS = List.of(
            new String[] { "test.ko1@example.com", "민지", "ko", "dev-1" },
            new String[] { "test.ja1@example.com", "はると", "ja", "dev-2" },
            new String[] { "test.ko2@example.com", "지호", "ko", "dev-3" });

    /** 테스트 사용자 3명을 만들고(없으면), 이들의 매칭·대기·일기를 모두 지워 처음 상태로 되돌립니다. */
    @Transactional
    public List<TestUser> prepareTestUsers() {
        List<TestUser> users = new ArrayList<>();
        for (String[] u : TEST_USERS) {
            users.add(findOrCreate(u[0], u[1], u[2], u[3]));
        }
        List<Long> ids = users.stream().map(TestUser::userId).toList();
        reset(ids);
        return users;
    }

    private TestUser findOrCreate(String email, String nickname, String lang, String googleSub) {
        List<?> found = em.createNativeQuery("SELECT user_id FROM users WHERE email = ?1")
                .setParameter(1, email)
                .getResultList();
        if (found.isEmpty()) {
            em.createNativeQuery("INSERT INTO users (google_sub, email, nickname, native_lang) VALUES (?1, ?2, ?3, ?4)")
                    .setParameter(1, googleSub)
                    .setParameter(2, email)
                    .setParameter(3, nickname)
                    .setParameter(4, lang)
                    .executeUpdate();
            found = em.createNativeQuery("SELECT user_id FROM users WHERE email = ?1")
                    .setParameter(1, email)
                    .getResultList();
        } else {
            // 닉네임·언어가 바뀌어 있으면 시연용 값으로 되돌림
            em.createNativeQuery("UPDATE users SET nickname = ?1, native_lang = ?2 WHERE email = ?3")
                    .setParameter(1, nickname)
                    .setParameter(2, lang)
                    .setParameter(3, email)
                    .executeUpdate();
        }
        Long id = ((Number) found.get(0)).longValue();
        return new TestUser(id, nickname, lang, email);
    }

    private void reset(List<Long> ids) {
        em.createNativeQuery("DELETE FROM match_queue WHERE user_id IN (?1)")
                .setParameter(1, ids).executeUpdate();
        // 일기를 지우면 첨삭은 DB가 함께 지우고(ON DELETE CASCADE), 단어장의 첨삭 연결은 비워 줌(SET NULL)
        em.createNativeQuery("DELETE FROM diary WHERE match_id IN "
                + "(SELECT match_id FROM matches WHERE user_ko_id IN (?1) OR user_ja_id IN (?1))")
                .setParameter(1, ids).executeUpdate();
        em.createNativeQuery("DELETE FROM matches WHERE user_ko_id IN (?1) OR user_ja_id IN (?1)")
                .setParameter(1, ids).executeUpdate();
    }
}
