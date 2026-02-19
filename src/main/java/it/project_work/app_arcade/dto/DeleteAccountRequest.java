package it.project_work.app_arcade.dto;

import jakarta.validation.constraints.NotBlank;

public record DeleteAccountRequest(
        @NotBlank
        String confirm
        ) {

}
