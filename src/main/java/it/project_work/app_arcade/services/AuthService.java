package it.project_work.app_arcade.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import it.project_work.app_arcade.models.User;
import it.project_work.app_arcade.repositories.UserRepository;
import jakarta.transaction.Transactional;

@Service
public class AuthService extends GenericService<Long, User, UserRepository> {

    private final PasswordEncoder passwordEncoder;

    public AuthService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }
    
    @Transactional
    public User register(String username, String email, String password) {

        if (username == null || username.trim().isEmpty()) {
        throw new IllegalArgumentException("Username obbligatorio");
        }
        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$";
        if (email == null || !email.matches(emailRegex)) {
            throw new IllegalArgumentException("Formato email non valido");
        }
        if (password == null || password.length() < 6) {
            throw new IllegalArgumentException("Password troppo corta (min 6 caratteri)");
        }
        
        if (getRepository().existsByEmail(email)) {
            throw new IllegalArgumentException("Email già in uso");
        }
        if (getRepository().existsByUsername(username)) {
            throw new IllegalArgumentException("Username già in uso");
        }

        User user = new User();
        user.setUsername(username.trim().toLowerCase());
        user.setEmail(email.trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(User.Role.USER);
        user.setEnabled(true);

        return getRepository().save(user);
    }
}