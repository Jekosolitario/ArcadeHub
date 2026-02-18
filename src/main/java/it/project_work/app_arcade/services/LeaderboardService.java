package it.project_work.app_arcade.services;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import it.project_work.app_arcade.dto.LeaderboardResponse;
import it.project_work.app_arcade.models.UserGameProgress;
import it.project_work.app_arcade.repositories.ProgressRepository;
import it.project_work.app_arcade.repositories.UserRepository;

@Service
public class LeaderboardService extends GenericService<Long, UserGameProgress, ProgressRepository> {
    private final UserRepository userRepository;

    public LeaderboardService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<LeaderboardResponse> getTopScores(String gameCode, int limit) {
        List<UserGameProgress> progresses = getRepository().findTopByGameCodeOrderByBestScoreDesc(gameCode, PageRequest.of(0, limit));
        return progresses.stream()
            .map(p -> LeaderboardResponse.fromEntity(userRepository.findById(p.getUser().getId()).orElse(null), p))
            .toList();
    }

    public List<LeaderboardResponse> topFlappy(int limit) {
        return getTopScores("flappy", limit);
    }
}
