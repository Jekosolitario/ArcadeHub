package it.project_work.app_arcade.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
    @NotBlank(message = "La vecchia password è obbligatoria")
    String oldPassword,

    @NotBlank(message = "La nuova password è obbligatoria")
    @Size(min = 6, max = 72, message = "La nuova password deve essere tra 6 e 72 caratteri")
    String newPassword
) {}