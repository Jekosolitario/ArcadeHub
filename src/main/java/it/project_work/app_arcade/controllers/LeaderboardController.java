package it.project_work.app_arcade.controllers;

import it.project_work.app_arcade.dto.LeaderboardResponse;
import it.project_work.app_arcade.dto.LeaderboardResponseDto;
import it.project_work.app_arcade.services.LeaderboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import it.project_work.app_arcade.dto.GameTopDTO;

import java.util.List;

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

        List<LeaderboardResponse> topPlayers = leaderboardService.getTopScoresPerGame("flappy", limit);
        return ResponseEntity.ok(new LeaderboardResponseDto(topPlayers, "flappy"));
    }

    /**
     * Generic per-game leaderboard: /api/leaderboard/game/{gameCode}
     */
    @GetMapping("/game/{gameCode}")
    public ResponseEntity<LeaderboardResponseDto> getGameLeaderboard(
            @PathVariable String gameCode,
            @RequestParam(defaultValue = "20") int limit) {

        List<LeaderboardResponse> rows = leaderboardService.getTopScoresPerGame(gameCode, limit);
        return ResponseEntity.ok(new LeaderboardResponseDto(rows, gameCode));
    }

    
    @GetMapping("/global")
    public ResponseEntity<List<LeaderboardResponse>> getTopPerGame(@RequestParam(defaultValue = "20") int limit) {

        return ResponseEntity.ok(leaderboardService.topTot(limit));
    }

    /**
     * Top-per-game summary: one row per game with the top player.
     */
    @GetMapping("/toppergame")
    public ResponseEntity<List<GameTopDTO>> getTopPerGameLegacy(@RequestParam(defaultValue = "20") int limit) {

        return ResponseEntity.ok(leaderboardService.topPerGame(limit));
    }

    /**
     * Return available game codes (used by frontend to populate selector)
     */
    @GetMapping("/games/codes")
    public ResponseEntity<List<String>> listGameCodes() {
        
        return ResponseEntity.ok(leaderboardService.listGameCodes());
    }
}