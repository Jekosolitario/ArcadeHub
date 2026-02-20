package it.project_work.app_arcade.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import it.project_work.app_arcade.dto.ProgressResponse;
import it.project_work.app_arcade.dto.SubmitScoreRequest;
import it.project_work.app_arcade.services.ProgressService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/game")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @PostMapping("/score")
    public ResponseEntity<ProgressResponse> submitScore(
            @Valid @RequestBody SubmitScoreRequest dto,
            Authentication auth
    ) {
        String username = auth.getName();
        return ResponseEntity.ok(
                progressService.submitScore(username, dto.gameCode(), dto.score())
        );
    }

    @GetMapping("/progress")
    public ResponseEntity<ProgressResponse> getProgress(
            @RequestParam String gameCode,
            Authentication auth
    ) {
        String username = auth.getName();
        return ResponseEntity.ok(
                progressService.getProgress(username, gameCode)
        );
    }
}
