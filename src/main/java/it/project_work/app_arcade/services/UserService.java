package it.project_work.app_arcade.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import it.project_work.app_arcade.dto.MeResponse;
import it.project_work.app_arcade.dto.UserResponse;
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
    
    public UserService(AvatarRepository avatarRepository, 
                       ProgressRepository progressRepository) {
        this.avatarRepository = avatarRepository;
        this.progressRepository = progressRepository;
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
}
