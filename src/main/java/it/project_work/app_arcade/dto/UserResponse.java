package it.project_work.app_arcade.dto;

import it.project_work.app_arcade.models.User;

public record UserResponse(
        Long id,
        String username,
        String email,
        User.Role role,
        int level,
        boolean enabled,
        Long avatarId
        ) {

    public static UserResponse fromEntity(it.project_work.app_arcade.models.User u) {
        return new UserResponse(
                u.getId(),
                u.getUsername(),
                u.getEmail(),
                u.getRole(),
                u.getLevel() != null ? u.getLevel() : 1,
                u.isEnabled(),
                u.getSelectedAvatar() != null ? u.getSelectedAvatar().getId() : null
        );
    }
}
