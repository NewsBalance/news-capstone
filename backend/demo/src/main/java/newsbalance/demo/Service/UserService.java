package newsbalance.demo.Service;

import jakarta.persistence.EntityNotFoundException;
import newsbalance.demo.DTO.UserInfoDto;
import newsbalance.demo.Entity.User;
import newsbalance.demo.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // @Lazy를 사용하여 순환 참조 해결
    @Autowired
    public UserService(UserRepository userRepository, @Lazy PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // 로그인 메서드 - 이메일과 비밀번호 검증
    public boolean login(String email, String password) {
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 일치하지 않습니다"));

            // 비밀번호 검증
            return passwordEncoder.matches(password, user.getPassword());
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public UserDetails loadUserByUsername(String nickname) throws UsernameNotFoundException {
        User user = userRepository.findByNickname(nickname)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with nickname: " + nickname));

        return new org.springframework.security.core.userdetails.User(
                user.getNickname(),
                user.getPassword(),
                Collections.emptyList()
        );
    }

    public User validateUser(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 일치하지 않습니다"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 일치하지 않습니다");
        }

        return user;
    }

    public User registerUser(String nickname, String password, String email, LocalDate birth) {
        // 중복 이메일 및 닉네임 체크
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다");
        }

        if (userRepository.existsByNickname(nickname)) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다");
        }

        // 비밀번호 암호화
        String encodedPassword = passwordEncoder.encode(password);

        // 사용자 생성 및 저장
        User user = new User(nickname, encodedPassword, email, birth);
        return userRepository.save(user);
    }

    public void save(User user) {
        userRepository.save(user);
    }

    public User getUserbyEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("해당 이메일로 사용자를 찾을 수 없습니다: " + email));
    }

    public User getUserbyNickname(String nickname) {
        return userRepository.findByNickname(nickname)
                .orElseThrow(() -> new EntityNotFoundException("해당 닉네임으로 사용자를 찾을 수 없습니다: " + nickname));
    }

    public boolean isExistbyEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public boolean isExistbyNickname(String nickname) {
        return userRepository.findByNickname(nickname) != null;
    }

    public void changeNickname(String email, String newnickname) {
        User user = getUserbyEmail(email);
        user.changeNickname(newnickname);
        userRepository.save(user);
    }

    public void changePassword(String email, String newpassword) {
        User user = getUserbyEmail(email);
        // 비밀번호 암호화 추가
        String encodedPassword = passwordEncoder.encode(newpassword);
        user.changePassword(encodedPassword);
        userRepository.save(user);
    }

    public void setBio(String nickname, String bio) {
        User user = getUserbyNickname(nickname);
        user.setBio(bio);
        userRepository.save(user);
    }

    public void delete(User user) {
        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public UserInfoDto getUserInfo(String nickname) {
        User user = userRepository.findByNickname(nickname)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다"));

        UserInfoDto userInfoDto = new UserInfoDto();
        userInfoDto.setNickname(user.getNickname());
        userInfoDto.setEmail(user.getEmail());
        // 필요한 다른 정보들 설정
        
        return userInfoDto;
    }
}
