package it.project_work.app_arcade.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Username obbligatorio")
        @Size(min = 3, max = 50, message = "Username 3-50 caratteri")
        String username,
        @NotBlank(message = "Password obbligatoria")
        @Size(min = 6, max = 72, message = "Password 6-72 caratteri")
        String password
        ) {

}
