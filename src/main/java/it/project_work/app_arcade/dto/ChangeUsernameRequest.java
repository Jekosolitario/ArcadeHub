package it.project_work.app_arcade.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangeUsernameRequest(
        @NotBlank
        @Size(min = 3, max = 20)
        @Pattern(
                regexp = "^[a-zA-Z0-9._-]{3,20}$",
                message = "Usa 3–20 caratteri: lettere, numeri, punto, underscore, trattino"
        )
        String newUsername
        ) {

}
