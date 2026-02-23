package it.project_work.app_arcade.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import it.project_work.app_arcade.dto.FeedbackCreateRequest;
import it.project_work.app_arcade.services.FeedbackService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    public ResponseEntity<Void> create(@Valid @RequestBody FeedbackCreateRequest req,
            Authentication auth) {
        feedbackService.create(req, auth);
        return ResponseEntity.noContent().build();
    }
}
