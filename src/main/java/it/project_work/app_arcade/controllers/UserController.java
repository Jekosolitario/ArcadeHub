package it.project_work.app_arcade.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import it.project_work.app_arcade.dto.ApiResponse;
// import it.project_work.app_arcade.dto.ChangePasswordRequest;
import it.project_work.app_arcade.dto.MeResponse;
import it.project_work.app_arcade.services.UserService;
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
    /*
    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestBody @Valid ChangePasswordRequest request,
            Authentication auth) { 
        
        userService.update(auth.getName(), request);
        
        return ResponseEntity.ok(new ApiResponse<>("Password aggiornata con successo", null));
    }
*/
}