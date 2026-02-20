package it.project_work.app_arcade.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import it.project_work.app_arcade.dto.AvatarDto;
import it.project_work.app_arcade.dto.SelectAvatarRequest;
import it.project_work.app_arcade.models.Avatar;
import it.project_work.app_arcade.models.User;
import it.project_work.app_arcade.repositories.AvatarRepository;
import it.project_work.app_arcade.repositories.UserRepository;

@RestController
@RequestMapping("/api")
public class AvatarController {

    private final AvatarRepository avatarRepo;
    private final UserRepository userRepo;

    public AvatarController(AvatarRepository avatarRepo, UserRepository userRepo) {
        this.avatarRepo = avatarRepo;
        this.userRepo = userRepo;
    }

    @GetMapping("/avatars")
    public List<AvatarDto> list(Authentication auth) {

        int lvl = 1; // guest/nuovo utente

        if (auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(String.valueOf(auth.getPrincipal()))) {
            User user = userRepo.findByUsername(auth.getName()).orElseThrow();
            lvl = (user.getLevel() == null) ? 1 : user.getLevel();
        }

        final int userLvl = lvl; // variabile “final” per usarla nella lambda

        return avatarRepo.findByActiveTrueOrderByRequiredLevelAsc()
                .stream()
                .map(a -> new AvatarDto(
                a.getId(),
                a.getName(),
                a.getImageUrl(),
                a.getRequiredLevel(),
                a.getRequiredLevel() <= userLvl
        ))
                .toList();
    }

    @PostMapping("/me/avatar")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void select(@RequestBody SelectAvatarRequest dto, Authentication auth) {
        if (dto == null || dto.avatarId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "avatarId richiesto");
        }

        User user = userRepo.findByUsername(auth.getName()).orElseThrow();
        Avatar a = avatarRepo.findById(dto.avatarId()).orElseThrow();

        int lvl = user.getLevel() == null ? 1 : user.getLevel();

        if (!Boolean.TRUE.equals(a.getActive()) || a.getRequiredLevel() > lvl) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Avatar locked");
        }

        user.setSelectedAvatar(a);
        userRepo.save(user);
    }
}
