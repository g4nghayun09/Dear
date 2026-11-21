package com.jpproject.dear.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByGoogleSub(String googleSub);

    boolean existsByNickname(String nickname);
}
