package it.project_work.app_arcade.services;

import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import it.project_work.app_arcade.dto.ChangePasswordRequest;
import it.project_work.app_arcade.dto.MeResponse;
import it.project_work.app_arcade.exceptions.BadRequestException;
import it.project_work.app_arcade.exceptions.ConflictException;
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
    public void updateUsername(String currentUsername, String newUsername) {
        User user = getRepository().findByUsername(currentUsername)
                .orElseThrow(() -> new BadRequestException("USER_NOT_FOUND", "Utente non trovato"));

        String clean = newUsername != null ? newUsername.trim() : "";

        if (clean.equalsIgnoreCase(user.getUsername())) {
            throw new BadRequestException("USERNAME_SAME", "Stai già usando questo username");
        }

        if (getRepository().existsByUsername(clean)) {
            throw new ConflictException("USERNAME_TAKEN", "Username già in uso");
        }

        user.setUsername(clean);
        getRepository().save(user);
    }

    @Transactional
    public void updatePassword(String username, ChangePasswordRequest dto) {
        User user = getRepository().findByUsername(username)
                .orElseThrow(() -> new BadRequestException("USER_NOT_FOUND", "Utente non trovato"));

        if (!dto.newPassword().equals(dto.newPasswordConfirm())) {
            throw new BadRequestException("PASSWORD_MISMATCH", "Le nuove password non coincidono");
        }

        if (!passwordEncoder.matches(dto.oldPassword(), user.getPasswordHash())) {
            throw new BadRequestException("OLD_PASSWORD_WRONG", "Password attuale non corretta");
        }

        user.setPasswordHash(passwordEncoder.encode(dto.newPassword()));
        getRepository().save(user);
    }

    public MeResponse meByUsername(String username) {
        User user = getRepository().findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Utente non trovato"));

        UserGameProgress flappy = progressRepository.findByUserId(user.getId()).stream()
                .filter(p -> "flappy".equalsIgnoreCase(p.getGameCode()))
                .findFirst()
                .orElse(null);

        return MeResponse.fromEntity(user, flappy);
    }

    @Transactional
    public MeResponse updateAvatarByUsername(String username, Long avatarId) {
        User user = getRepository().findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Utente non trovato"));

        var avatar = avatarRepository.findById(avatarId)
                .orElseThrow(() -> new IllegalArgumentException("Avatar non trovato"));

        user.setSelectedAvatar(avatar);
        User saved = getRepository().save(user);

        UserGameProgress flappy = progressRepository.findByUserId(saved.getId()).stream()
                .filter(p -> "flappy".equalsIgnoreCase(p.getGameCode()))
                .findFirst()
                .orElse(null);

        return MeResponse.fromEntity(saved, flappy);
    }

    @Transactional
    public void deleteUser(String username) {
        User user = getRepository().findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Utente non trovato"));

        Long userId = user.getId();

        // cancella dipendenze (progress)
        progressRepository.deleteAllByUserId(userId);

        // cancella l’utente
        getRepository().delete(user);
    }
}
