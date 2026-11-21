package com.jpproject.dear.member;


import com.jpproject.dear.dto.LoginRequest;
import com.jpproject.dear.dto.MemberResponse;
import com.jpproject.dear.dto.SignupRequest;
import com.jpproject.dear.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class MemberService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    // 생성자 주입
    public MemberService(MemberRepository memberRepository, PasswordEncoder passwordEncoder) {
        this.memberRepository = memberRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public MemberResponse signup(SignupRequest request) {
        if(memberRepository.existsByLoginId(request.getLoginId())) {
            throw new ApiException(HttpStatus.CONFLICT, "이미 사용중인 아이디입니다.");
        }
        String password = request.getPassword(); // 평문 비밀번호
        String encodePassword = passwordEncoder.encode(password); // 암호화된 비밀번호
        Member member = new Member(request.getLoginId(), encodePassword, request.getName());
        memberRepository.save(member);
        return MemberResponse.from(member);
    }

    public MemberResponse getMember(Long id) {
        Member member = memberRepository.findById(id).orElse(null);
        if(member == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "존재하지 않는 회원입니다.");
        }
        return MemberResponse.from(member);
    }

    public MemberResponse login(LoginRequest request) {
        Member member = memberRepository.findByLoginId(request.getLoginId()).orElse(null);
        if(member == null
                || !passwordEncoder.matches((request.getPassword()), member.getPassword())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "아이디 또는 비밀번호가 일치하지 않습니다.");
        }
        return MemberResponse.from(member);
    }
}
