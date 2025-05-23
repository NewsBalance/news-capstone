package newsbalance.demo.Service;

import jakarta.persistence.EntityNotFoundException;
import newsbalance.demo.DTO.UserInfoDto;
import newsbalance.demo.Entity.User;
import newsbalance.demo.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public void save(User user) {
        userRepository.save(user);
    }

    public boolean login(String email, String password) {
        return userRepository.findByEmailAndPassword(email, password) != null;
    }

    public User getUserbyEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public boolean isExistbyEmail(String email) {
        return userRepository.findByEmail(email) != null;
    }

    public void changeNickname(String email, String newnickname) {
        User user = userRepository.findByEmail(email);
        user.changeNickname(newnickname);
        userRepository.save(user);
    }

    public void changePassword(String email, String newpassword) {
        User user = userRepository.findByEmail(email);
        user.changePassword(newpassword);
        userRepository.save(user);
    }

    public void delete(User user) {
        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public UserInfoDto getUserInfo(String nickname) {
        User user = userRepository.findByNickname(nickname);
        if (user == null) {
            throw new EntityNotFoundException("사용자를 찾을 수 없습니다");
        }

        return new UserInfoDto(
                user.getNickname(),
                user.getEmail()
        );
    }

}
