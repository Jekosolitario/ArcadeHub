package it.project_work.app_arcade.dto;

import it.project_work.app_arcade.models.User;

public record MeResponse(
        Long id,
        String username,
        String email,
        User.Role role,
        int level,
        boolean enabled,
        Long avatarId,
        Integer bestScore
        ) {
    
    public static MeResponse fromEntity(User u, Integer bestScore) {
        return new MeResponse(
                u.getId(),
                u.getUsername(),
                u.getEmail(),
                u.getRole(),
                u.getLevel() != null ? u.getLevel() : 1,
                u.isEnabled(),
                u.getSelectedAvatar() != null ? u.getSelectedAvatar().getId() : 0,
                bestScore
        );
    }
}
