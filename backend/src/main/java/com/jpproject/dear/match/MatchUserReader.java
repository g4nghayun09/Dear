package com.jpproject.dear.match;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;

/**
 * 매칭에 필요한 회원 정보(닉네임, 모국어)만 users 테이블에서 읽습니다.
 * 회원 엔티티(User)는 로그인 담당이 만들기 때문에, 서로 코드가 겹치지 않도록 SQL로 직접 읽습니다.
 * User 엔티티가 완성되면 UserRepository로 바꿔도 됩니다.
 */
@Component
@RequiredArgsConstructor
public class MatchUserReader {

    private final EntityManager em;

    public record MatchUser(Long userId, String nickname, String nativeLang) {
    }

    public Optional<MatchUser> find(Long userId) {
        List<?> rows = em.createNativeQuery("SELECT nickname, native_lang FROM users WHERE user_id = ?1")
                .setParameter(1, userId)
                .getResultList();
        if (rows.isEmpty()) {
            return Optional.empty();
        }
        Object[] row = (Object[]) rows.get(0);
        return Optional.of(new MatchUser(userId, (String) row[0], (String) row[1]));
    }
}
