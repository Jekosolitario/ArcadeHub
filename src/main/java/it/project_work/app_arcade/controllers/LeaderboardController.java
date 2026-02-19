package it.project_work.app_arcade.controllers;

import it.project_work.app_arcade.dto.LeaderboardResponse;
import it.project_work.app_arcade.services.LeaderboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    /**
     * Endpoint per ottenere la classifica di Flappy Bird.
     * Come da Step 8, il limite di default è 20.
     */
    @GetMapping("/flappy")
    public ResponseEntity<LeaderboardResponseDto> getFlappyLeaderboard(
            @RequestParam(defaultValue = "20") int limit) {
        
        // Utilizziamo il metodo topTot del service come richiesto
        List<LeaderboardResponse> topPlayers = leaderboardService.topTot(limit);
        
        // Incapsuliamo la lista nel DTO di risposta
        LeaderboardResponseDto response = new LeaderboardResponseDto();
        
        return ResponseEntity.ok(response);
    }
}