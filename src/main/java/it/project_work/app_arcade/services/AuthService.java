package it.project_work.app_arcade.services;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import it.project_work.app_arcade.dto.RegisterRequest;
import it.project_work.app_arcade.dto.UserResponse;
import it.project_work.app_arcade.exceptions.BadRequestException;
import it.project_work.app_arcade.exceptions.ConflictException;
import it.project_work.app_arcade.models.Avatar;
import it.project_work.app_arcade.models.User;
import it.project_work.app_arcade.repositories.AvatarRepository;
import it.project_work.app_arcade.repositories.UserRepository;
import jakarta.transaction.Transactional;

@Service
public class AuthService extends GenericService<Long, User, UserRepository> {

    private final PasswordEncoder passwordEncoder;
    private final AvatarRepository avatarRepository;

    public AuthService(PasswordEncoder passwordEncoder, AvatarRepository avatarRepository) {
        this.passwordEncoder = passwordEncoder;
        this.avatarRepository = avatarRepository;
    }

    /* 
    eviti 3 parametri “sciolti” che crescono (oggi aggiungi avatarId, domani altro)
    controller e service parlano lo stesso linguaggio (DTO)
    il front manda JSON unico e stabile
     */
    @Transactional
    public UserResponse register(RegisterRequest dto) {

        // Business checks (unique)
        if (getRepository().existsByEmail(dto.email().trim().toLowerCase())) {
            throw new ConflictException("EMAIL_TAKEN", "Email già in uso");
        }
        if (getRepository().existsByUsername(dto.username().trim())) {
            throw new ConflictException("USERNAME_TAKEN", "Username già in uso");
        }

        // Avatar FK check
        Avatar avatar = avatarRepository.findById(dto.avatarId())
                .orElseThrow(() -> new BadRequestException("AVATAR_INVALID", "Avatar non valido"));

        User user = new User();
        user.setUsername(dto.username().trim());                 // non forzo lowercase
        user.setEmail(dto.email().trim().toLowerCase());         // ok lowercase
        user.setPasswordHash(passwordEncoder.encode(dto.password()));
        user.setRole(User.Role.USER);
        user.setEnabled(true);
        user.setLevel(1);
        user.setSelectedAvatar(avatar);

        return UserResponse.fromEntity(getRepository().save(user));
    }
}
