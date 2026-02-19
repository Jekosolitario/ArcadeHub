package it.project_work.app_arcade.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import it.project_work.app_arcade.dto.ApiResponse;
import it.project_work.app_arcade.dto.ChangePasswordRequest;
import it.project_work.app_arcade.dto.ChangeUsernameRequest;
import it.project_work.app_arcade.dto.MeResponse;
import it.project_work.app_arcade.services.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/profile")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> getMe(Authentication auth) {
        return ResponseEntity.ok(userService.meByUsername(auth.getName()));
    }

    @PutMapping("/me/avatar")
    public ResponseEntity<MeResponse> updateAvatar(Authentication auth,
            @RequestParam Long avatarId) {
        return ResponseEntity.ok(userService.updateAvatarByUsername(auth.getName(), avatarId));
    }

    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> updatePassword(Authentication auth,
            @RequestBody @Valid ChangePasswordRequest dto, HttpServletRequest request,
            HttpServletResponse response
    ) {

        userService.updatePassword(auth.getName(), dto);

        // logout  invalida sessione + clear context
        new SecurityContextLogoutHandler().logout(request, response, auth);

        // scade il cookie della sessione
        Cookie jsid = new Cookie("JSESSIONID", "");
        jsid.setPath("/");
        jsid.setMaxAge(0);
        response.addCookie(jsid);

        return ResponseEntity.noContent().build(); // -> 204
    }

    @PutMapping("/me/username")
    public ResponseEntity<Void> changeUsername(Authentication auth,
            @Valid @RequestBody ChangeUsernameRequest dto,
            HttpServletRequest request,
            HttpServletResponse response) {

        userService.updateUsername(auth.getName(), dto.newUsername());

        // logout “secure”
        new SecurityContextLogoutHandler().logout(request, response, auth);

        Cookie jsid = new Cookie("JSESSIONID", "");
        jsid.setPath("/");
        jsid.setMaxAge(0);
        jsid.setHttpOnly(true);
        response.addCookie(jsid);

        return ResponseEntity.noContent().build(); // 204
    }

}
