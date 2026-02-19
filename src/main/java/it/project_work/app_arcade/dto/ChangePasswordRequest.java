package it.project_work.app_arcade.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank String oldPassword,
        @NotBlank @Size(min = 6, max = 72) String newPassword,
        @NotBlank String newPasswordConfirm
) {}
