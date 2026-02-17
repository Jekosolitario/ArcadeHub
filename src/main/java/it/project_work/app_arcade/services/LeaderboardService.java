package it.project_work.app_arcade.services;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import it.project_work.app_arcade.models.UserGameProgress;
import it.project_work.app_arcade.repositories.ProgressRepository;

@Service
public class LeaderboardService extends GenericService<Long, UserGameProgress, ProgressRepository> {
    public List<UserGameProgress> getTopScores(String gameCode, int limit) {
        return getRepository().findTopByGameCodeOrderByBestScoreDesc(gameCode, PageRequest.of(0, limit));
    }

    public List<UserGameProgress> topFlappy(int limit) {
        return getTopScores("Flappy", limit);
    }
}
