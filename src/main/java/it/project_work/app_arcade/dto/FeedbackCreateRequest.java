package it.project_work.app_arcade.dto;

import it.project_work.app_arcade.models.Feedback;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FeedbackCreateRequest(
        @NotNull
        Feedback.Type type,
        @NotBlank
        @Email
        @Size(max = 255)
        String email,
        @NotBlank
        @Size(min = 3, max = 5000)
        String message,
        @Size(max = 120)
        String page,
        @Size(max = 255)
        String userAgent
        ) {

}
