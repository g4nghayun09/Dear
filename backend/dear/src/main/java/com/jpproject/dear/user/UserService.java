package com.jpproject.dear.user;

import com.jpproject.dear.auth.GoogleTokenVerifier;
import com.jpproject.dear.auth.GoogleTokenVerifier.GoogleUserInfo;
import com.jpproject.dear.dto.UserResponse;
import com.jpproject.dear.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final GoogleTokenVerifier googleTokenVerifier;

    public UserService(UserRepository userRepository, GoogleTokenVerifier googleTokenVerifier) {
        this.userRepository = userRepository;
        this.googleTokenVerifier = googleTokenVerifier;
    }

    // 구글 로그인. 처음이면 회원가입(닉네임·모국어는 비워둠), 이미 있으면 그대로 로그인
    public UserResponse loginWithGoogle(String idToken) {
        GoogleUserInfo info = googleTokenVerifier.verify(idToken);
        User user = userRepository.findByGoogleSub(info.sub())
                .orElseGet(() -> userRepository.save(new User(info.sub(), info.email())));
        return UserResponse.from(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getUser(Long userId) {
        return UserResponse.from(findUser(userId));
    }

    // 가입 1단계: 닉네임
    public UserResponse setNickname(Long userId, String nickname) {
        User user = findUser(userId);
        boolean sameAsMine = nickname.equals(user.getNickname());
        if (!sameAsMine && userRepository.existsByNickname(nickname)) {
            throw new ApiException(HttpStatus.CONFLICT, "이미 사용 중인 닉네임이에요.");
        }
        user.changeNickname(nickname);
        return UserResponse.from(user);
    }

    // 가입 2단계: 모국어 (한 번 정하면 변경 불가)
    public UserResponse setNativeLang(Long userId, String nativeLang) {
        User user = findUser(userId);
        if (user.getNickname() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "닉네임을 먼저 입력해주세요.");
        }
        if (!user.setNativeLangOnce(nativeLang)) {
            throw new ApiException(HttpStatus.CONFLICT, "모국어는 변경할 수 없어요.");
        }
        return UserResponse.from(user);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "존재하지 않는 회원입니다."));
    }
}
