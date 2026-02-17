package it.project_work.app_arcade.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import it.project_work.app_arcade.models.User;
import it.project_work.app_arcade.models.UserGameProgress;
import it.project_work.app_arcade.repositories.AvatarRepository;
import it.project_work.app_arcade.repositories.ProgressRepository;
import it.project_work.app_arcade.repositories.UserRepository;

@Service
public class UserService extends GenericService<Long, User, UserRepository> {
    @Autowired
    AvatarRepository avatarRepository;

    @Autowired
    ProgressRepository progressRepository;

    public List<UserGameProgress> me(Long userId) {
        return progressRepository.findByUserId(userId);
    }


    public User updateAvatar(Long userId, Long avatarId) {
        User user = getRepository().findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("Utente non trovato"));
        user.setSelectedAvatar(avatarRepository.findById(avatarId)
            .orElseThrow(() -> new IllegalArgumentException("Avatar non trovato")));
        return getRepository().save(user);
    }
}
