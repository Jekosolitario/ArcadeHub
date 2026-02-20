package it.project_work.app_arcade.services;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import it.project_work.app_arcade.dto.GameTopDTO;
import it.project_work.app_arcade.dto.LeaderboardResponse;
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

    public List<LeaderboardResponse> topFlappy(int limit) {
        return getTopScoresPerGame("flappy", limit);
    }

    public List<LeaderboardResponse> topTot(int limit) {

        if (limit <= 0) {
            return Collections.emptyList();
        }

        List<User> users = userRepository.findAll();
        List<LeaderboardResponse> responses = new ArrayList<>();
        for (User user : users) {
            responses.add(new LeaderboardResponse(user.getUsername(), getTotScoreUser(user.getId()), user.getLevel()));
        }

        responses.sort(Comparator.comparing(LeaderboardResponse::bestScore).reversed());

        if (limit > 0 && limit < responses.size()) {
            responses = responses.subList(0, limit);
        }
        return responses;
    }

    public List<LeaderboardResponse> getTopScoresPerGame(String gameCode, int limit) {

        if (limit <= 0) {
            return Collections.emptyList();
        }

        List<UserGameProgress> progresses = getRepository().findByGameCodeOrderByBestScoreDesc(gameCode, PageRequest.of(0, limit));
        return progresses.stream()
                .map(p -> LeaderboardResponse.fromEntity(userRepository.findById(p.getUser().getId()).orElse(null), p))
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

                        }out.add(new GameTopDTO(code, u.getUsername(), p.getBestScore(), u.getLevel()));
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

    public Integer getTotScoreUser(long userId) {
        return getRepository().findByUserId(userId).stream()
                .map(UserGameProgress::getBestScore)
                .reduce(0, Integer::sum);
    }
}
