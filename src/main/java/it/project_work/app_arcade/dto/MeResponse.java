package it.project_work.app_arcade.dto;

import it.project_work.app_arcade.models.User;
import it.project_work.app_arcade.models.UserGameProgress;

public record MeResponse(
        Long id,
        String username,
        String email,
        User.Role role,
        int level,
        boolean enabled,
        Long avatarId,
        Integer bestScore,
        Integer lastScore
        ) {
    
    public static MeResponse fromEntity(User u, UserGameProgress progress) {
        return new MeResponse(
                u.getId(),
                u.getUsername(),
                u.getEmail(),
                u.getRole(),
                u.getLevel() != null ? u.getLevel() : 1,
                u.isEnabled(),
                u.getSelectedAvatar() != null ? u.getSelectedAvatar().getId() : 1,
                progress != null ? progress.getBestScore() : 0,
                progress != null ? progress.getLastScore() : 0
        );
    }
}
