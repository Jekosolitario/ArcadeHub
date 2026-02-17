package it.project_work.app_arcade.services;

import it.project_work.app_arcade.models.User;
import it.project_work.app_arcade.repositories.UserRepository;

public class AuthService extends GenericService<Long, User, UserRepository> {
    
    public User Register(String username, String email, String password) {
        if (getRepository().existsByEmail(email)) {
            throw new IllegalArgumentException("Email già in uso");
        }
        if (getRepository().existsByUsername(username)) {
            throw new IllegalArgumentException("Username già in uso");
        }
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(password); // In un'app reale, hashare la password!
        user.setRole(User.Role.USER);
        return getRepository().save(user);
    }
}