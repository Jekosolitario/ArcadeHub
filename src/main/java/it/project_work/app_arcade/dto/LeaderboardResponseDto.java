package it.project_work.app_arcade.dto;

import java.util.List;

public record LeaderboardResponseDto(
    List<LeaderboardResponse> rows,
    String gameCode
) {}
