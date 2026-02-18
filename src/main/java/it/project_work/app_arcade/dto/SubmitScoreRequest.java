package it.project_work.app_arcade.dto;

public record SubmitScoreRequest(
    Long userId, 
    String gamecode, 
    Integer scoreRun) {
    
}
