package it.project_work.app_arcade.dto;

import it.project_work.app_arcade.models.UserGameProgress;

public record SubmitScoreRequest(
    Long userId, 
    String gamecode, 
    Integer scoreRun) {
    

    public static SubmitScoreRequest fromEntity(UserGameProgress progress) {
        return new SubmitScoreRequest(
            progress.getUser().getId(),
            progress.getGameCode(),
            progress.getLastScore()
        );

    }
}
