package it.project_work.app_arcade.services;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import it.project_work.app_arcade.dto.MeResponse;
import it.project_work.app_arcade.models.User;
import it.project_work.app_arcade.models.UserGameProgress;
import it.project_work.app_arcade.repositories.AvatarRepository;
import it.project_work.app_arcade.repositories.ProgressRepository;
import it.project_work.app_arcade.repositories.UserRepository;
import jakarta.transaction.Transactional;

@Service
public class UserService extends GenericService<Long, User, UserRepository> {

    private final AvatarRepository avatarRepository;

    private final ProgressRepository progressRepository;

    private final PasswordEncoder passwordEncoder;

    public UserService(AvatarRepository avatarRepository,
            ProgressRepository progressRepository, PasswordEncoder passwordEncoder) {
        this.avatarRepository = avatarRepository;
        this.progressRepository = progressRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public MeResponse me(Long userId) {
        User user = getRepository().findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utente non trovato"));
        List<UserGameProgress> progress = progressRepository.findByUserId(userId);
        return MeResponse.fromEntity(user, progress.stream()
                .filter(p -> p.getGameCode().equals("flappy"))
                .findFirst()
                .orElse(null));
    }

    @Transactional
    public MeResponse updateAvatar(Long userId, Long avatarId) {
        User user = getRepository().findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utente non trovato"));
        user.setSelectedAvatar(avatarRepository.findById(avatarId)
                .orElseThrow(() -> new IllegalArgumentException("Avatar non trovato")));
        List<UserGameProgress> progress = progressRepository.findByUserId(userId);
        return MeResponse.fromEntity(getRepository().save(user), progress.stream()
                .filter(p -> p.getGameCode().equals("flappy"))
                .findFirst()
                .orElse(null));
    }

    @Transactional
    public MeResponse updateUsername(Long userId, String newUsername) {
        User user = getRepository().findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utente non trovato"));
        if (getRepository().existsByUsername(newUsername)) {
            throw new IllegalArgumentException("Username già utilizzato");
        }
        user.setUsername(newUsername);
        List<UserGameProgress> progress = progressRepository.findByUserId(userId);
        return MeResponse.fromEntity(getRepository().save(user), progress.stream()
                .filter(p -> p.getGameCode().equals("flappy"))
                .findFirst()
                .orElse(null));
    }

    @Transactional
    public MeResponse updatePassword(Long userId, String oldPassword, String newPassword) {
        User user = getRepository().findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utente non trovato"));
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new IllegalArgumentException("Password errata");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        List<UserGameProgress> progress = progressRepository.findByUserId(userId);
        return MeResponse.fromEntity(getRepository().save(user), progress.stream()
                .filter(p -> p.getGameCode().equals("flappy"))
                .findFirst()
                .orElse(null));
    }



    public MeResponse meByUsername(String username) {
        Long userId = getRepository().findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"))
                .getId();

        return me(userId);
    }

    @Transactional
    public MeResponse updateAvatarByUsername(String username, Long avatarId) {
        Long userId = getRepository().findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"))
                .getId();

        return updateAvatar(userId, avatarId);
    }
}
