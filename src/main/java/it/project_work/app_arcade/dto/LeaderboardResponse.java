package it.project_work.app_arcade.dto;

import it.project_work.app_arcade.models.User;
import it.project_work.app_arcade.models.UserGameProgress;

public record LeaderboardResponse(
    String username,
    Integer bestScore,
    Integer level
) {
    public static LeaderboardResponse fromEntity(User user, UserGameProgress progress) {
        return new LeaderboardResponse(user.getUsername(), progress.getBestScore(), user.getLevel());
    }
}
