package it.project_work.app_arcade.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Username obbligatorio")
        @Size(min = 3, max = 50, message = "Username 3-50 caratteri")
        String username,
        @NotBlank(message = "Email obbligatoria")
        @Email(message = "Email non valida")
        @Size(max = 255, message = "Email max 255 caratteri")
        String email,
        @NotBlank(message = "Password obbligatoria")
        @Size(min = 6, max = 72, message = "Password 6-72 caratteri")
        String password,
        @NotNull(message = "Avatar obbligatorio")
        Long avatarId
        ) {
                
}
