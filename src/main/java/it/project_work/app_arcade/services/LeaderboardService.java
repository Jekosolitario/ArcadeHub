package it.project_work.app_arcade.services;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import it.project_work.app_arcade.dto.GameTopDTO;
import it.project_work.app_arcade.dto.LeaderboardResponse;
import it.project_work.app_arcade.models.Avatar;
import it.project_work.app_arcade.models.User;
import it.project_work.app_arcade.models.UserGameProgress;
import it.project_work.app_arcade.repositories.ProgressRepository;
import it.project_work.app_arcade.repositories.UserRepository;

@Service
public class LeaderboardService extends GenericService<Long, UserGameProgress, ProgressRepository> {

    private final UserRepository userRepository;

    public LeaderboardService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<GameTopDTO> topFlappy(int limit) {
        return getTopScoresPerGame("flappy", limit);
    }

    public List<LeaderboardResponse> topTot(int limit) {
        if (limit <= 0) {
            return Collections.emptyList();
        }

        List<User> users = userRepository.findAll();
        List<LeaderboardResponse> responses = new ArrayList<>();

        for (User user : users) {
            long totalScore = getTotScoreUser(user.getId());
            long totalPlayed = getTotPlayedUser(user.getId());

            responses.add(new LeaderboardResponse(
                    user.getUsername(),
                    extractAvatarUrl(user),
                    totalScore,
                    totalPlayed,
                    user.getLevel()
            ));
        }

        responses.sort(Comparator.comparing(LeaderboardResponse::totalScore).reversed());

        if (limit < responses.size()) {
            responses = responses.subList(0, limit);
        }
        return responses;
    }

    private String extractAvatarUrl(User u) {
        if (u == null) {
            return null;
        }
        Avatar a = u.getSelectedAvatar();
        return (a != null) ? a.getImageUrl() : null;
    }

    public List<GameTopDTO> getTopScoresPerGame(String gameCode, int limit) {
        if (limit <= 0) {
            return Collections.emptyList();
        }

        List<UserGameProgress> progresses
                = getRepository().findByGameCodeOrderByBestScoreDesc(gameCode, PageRequest.of(0, limit));

        return progresses.stream()
                .map(p -> {
                    User u = userRepository.findById(p.getUser().getId()).orElse(null);
                    if (u == null) {
                        return null;
                    }

                    return new GameTopDTO(
                            u.getUsername(),
                            extractAvatarUrl(u), // <-- vedi helper sotto
                            p.getBestScore(),
                            u.getLevel(),
                            p.getPlayedCount() // <-- deve esistere nel model
                    );
                })
                .filter(x -> x != null)
                .toList();
    }

    /**
     * Top entry for every distinct game (one row per game)
     */
    public List<GameTopDTO> topPerGame(int limit) {
        if (limit <= 0) {
            return Collections.emptyList();
        }

        List<String> codes = getRepository().findDistinctGameCodes();
        List<GameTopDTO> out = new ArrayList<>();

        for (String code : codes) {
            List<UserGameProgress> topForCode = getRepository().findByGameCodeOrderByBestScoreDesc(code, PageRequest.of(0, 1));
            if (topForCode.isEmpty()) {
                continue;
            }
            UserGameProgress p = topForCode.get(0);
            User u = userRepository.findById(p.getUser().getId()).orElse(null);
            if (u == null) {
                continue; // defensive

            }
            out.add(new GameTopDTO(
                    u.getUsername(),
                    extractAvatarUrl(u),
                    p.getBestScore(),
                    u.getLevel(),
                    p.getPlayedCount()
            ));
        }

        out.sort(Comparator.comparing(GameTopDTO::bestScore).reversed());
        if (limit > 0 && limit < out.size()) {
            out = out.subList(0, limit);
        }
        return out;
    }

    public List<String> listGameCodes() {
        return getRepository().findDistinctGameCodes();
    }

    public long getTotScoreUser(long userId) {
        return getRepository().findByUserId(userId).stream()
                .mapToLong(p -> p.getBestScore() == null ? 0 : p.getBestScore())
                .sum();
    }

    public long getTotPlayedUser(long userId) {
        return getRepository().findByUserId(userId).stream()
                .mapToLong(p -> p.getPlayedCount() == null ? 0 : p.getPlayedCount())
                .sum();
    }
}
