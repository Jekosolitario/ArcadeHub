package it.project_work.app_arcade.services;

import org.springframework.stereotype.Service;

import it.project_work.app_arcade.models.User;
import it.project_work.app_arcade.models.UserGameProgress;
import it.project_work.app_arcade.repositories.ProgressRepository;
import it.project_work.app_arcade.repositories.UserRepository;
import jakarta.transaction.Transactional;

@Service
public class ProgressService extends GenericService<Long, UserGameProgress, ProgressRepository> {
    private final UserRepository userRepository;

    public ProgressService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public UserGameProgress submitScore(Long userId, String gamecode, Integer scoreRun){

        UserGameProgress progress = getRepository().findByUserIdAndGameCode(userId, gamecode).orElse(null);

        User user =userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("Utente non trovato"));

        if(levelUp(user, scoreRun)){
            user.setLevel(user.getLevel()+1);
            userRepository.save(user);
        }

        if (progress == null){
            UserGameProgress newProgress = new UserGameProgress();
            newProgress.setUser(user);
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

    private boolean levelUp(User user, int score) {
        int levelUpThreshold = 5;

        return score>=levelUpThreshold;
    }
}
