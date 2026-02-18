package it.project_work.app_arcade.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class LeaderboardController {

    @GetMapping("/api/leaderboard/flappy")
    public String getFlappyLeaderboard() {
        // TODO: Replace with actual leaderboard logic and return type
        return "Leaderboard data";
    }

}
