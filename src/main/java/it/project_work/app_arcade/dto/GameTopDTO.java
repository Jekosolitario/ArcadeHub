package it.project_work.app_arcade.dto;

public record GameTopDTO(
        String gameCode,
        String username,
        Integer bestScore,
        Integer level
) {}