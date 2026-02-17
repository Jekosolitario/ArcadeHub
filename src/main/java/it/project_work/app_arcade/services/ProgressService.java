package it.project_work.app_arcade.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import it.project_work.app_arcade.models.User;
import it.project_work.app_arcade.models.UserGameProgress;
import it.project_work.app_arcade.repositories.ProgressRepository;
import it.project_work.app_arcade.repositories.UserRepository;

@Service
public class ProgressService extends GenericService<Long, UserGameProgress, ProgressRepository> {
    @Autowired UserRepository userRepository;
    public UserGameProgress submitScore(Long userId, String gamecode, Integer scoreRun){
        UserGameProgress progress = getRepository().findByUserIdAndGameCode(userId, gamecode).orElse(null);

        if (progress == null){
            UserGameProgress newProgress = new UserGameProgress();
            newProgress.setUser(userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("Utente non trovato")));
            newProgress.setGameCode(gamecode);
            newProgress.setBestScore(scoreRun);
            newProgress.setLastScore(scoreRun);
            return getRepository().save(newProgress);
        }

        progress.setLastScore(scoreRun);
        progress.setPlayedCount(progress.getPlayedCount()+1);
        if (scoreRun > progress.getBestScore()) {
            progress.setBestScore(scoreRun);
        }
        return getRepository().save(progress);
    }
}
