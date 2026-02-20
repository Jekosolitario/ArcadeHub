package it.project_work.app_arcade.services;

import org.springframework.stereotype.Service;

import it.project_work.app_arcade.dto.ProgressResponse;
import it.project_work.app_arcade.models.User;
import it.project_work.app_arcade.models.UserGameProgress;
import it.project_work.app_arcade.repositories.ProgressRepository;
import it.project_work.app_arcade.repositories.UserRepository;
import it.project_work.app_arcade.utilities.LevelInfo;
import it.project_work.app_arcade.utilities.Leveling;
import jakarta.transaction.Transactional;

@Service
public class ProgressService extends GenericService<Long, UserGameProgress, ProgressRepository> {

    private final UserRepository userRepository;

    public ProgressService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public ProgressResponse submitScore(String username, String gameCode, Integer scoreRun) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Utente non trovato"));

        String code = gameCode.trim().toLowerCase();

        UserGameProgress progress = getRepository()
                .findByUserIdAndGameCode(user.getId(), code)
                .orElseGet(() -> {
                    UserGameProgress p = new UserGameProgress();
                    p.setUser(user);
                    p.setGameCode(code);
                    return p;
                });

        int score = (scoreRun == null) ? 0 : Math.max(0, scoreRun);

        progress.setLastScore(score);
        progress.setPlayedCount(progress.getPlayedCount() + 1);

        if (score > progress.getBestScore()) {
            progress.setBestScore(score);
        }

        int oldLevel = (user.getLevel() == null) ? 1 : user.getLevel();
        user.setXpTotal(user.getXpTotal() + score);

        LevelInfo info = Leveling.fromTotalXp(user.getXpTotal());
        user.setLevel(info.level());

        UserGameProgress saved = getRepository().save(progress);
        userRepository.save(user);

        return new ProgressResponse(
                saved.getBestScore(),
                saved.getLastScore(),
                user.getXpTotal(),
                user.getLevel(),
                user.getLevel() > oldLevel,
                info.xpIntoLevel(),
                info.xpToNext()
        );
    }

    @Transactional
    public ProgressResponse getProgress(String username, String gameCode) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Utente non trovato"));

        String code = (gameCode == null) ? "" : gameCode.trim().toLowerCase();
        if (code.isEmpty()) {
            throw new IllegalArgumentException("gameCode richiesto");
        }

        UserGameProgress progress = getRepository()
                .findByUserIdAndGameCode(user.getId(), code)
                .orElse(null);

        int best = (progress != null && progress.getBestScore() != null) ? progress.getBestScore() : 0;
        int last = (progress != null && progress.getLastScore() != null) ? progress.getLastScore() : 0;

        long xpTotal = user.getXpTotal(); // ✅ primitive, mai null

        LevelInfo info = Leveling.fromTotalXp(xpTotal);

        return new ProgressResponse(
                best,
                last,
                xpTotal,
                info.level(),
                false,
                info.xpIntoLevel(),
                info.xpToNext()
        );
    }
}
