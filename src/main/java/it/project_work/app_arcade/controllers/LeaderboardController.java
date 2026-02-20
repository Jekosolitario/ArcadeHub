package it.project_work.app_arcade.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import it.project_work.app_arcade.dto.GameTopDTO;
import it.project_work.app_arcade.dto.LeaderboardResponse;
import it.project_work.app_arcade.dto.LeaderboardResponseDto;
import it.project_work.app_arcade.services.LeaderboardService;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    /**
     * Legacy endpoint for Flappy (kept for compatibility).
     */
    @GetMapping("/flappy")
    public ResponseEntity<LeaderboardResponseDto> getFlappyLeaderboard(
            @RequestParam(defaultValue = "20") int limit) {

        List<GameTopDTO> topPlayers = leaderboardService.getTopScoresPerGame("flappy", limit);
        return ResponseEntity.ok(new LeaderboardResponseDto(topPlayers, "flappy"));
    }

    /**
     * Generic per-game leaderboard: /api/leaderboard/game/{gameCode}
     */
    @GetMapping("/global")
    public ResponseEntity<List<LeaderboardResponse>> getGlobal(
            @RequestParam(defaultValue = "20") int limit) {

        return ResponseEntity.ok(leaderboardService.topTot(limit));
    }

    /**
     * Return available game codes (used by frontend to populate selector)
     */
    @GetMapping("/game/{gameCode}")
    public ResponseEntity<LeaderboardResponseDto<GameTopDTO>> getGameLeaderboard(
            @PathVariable String gameCode,
            @RequestParam(defaultValue = "20") int limit) {

        String code = gameCode.toLowerCase();
        List<GameTopDTO> rows = leaderboardService.getTopScoresPerGame(code, limit);
        return ResponseEntity.ok(new LeaderboardResponseDto<>(rows, code));
    }
}
