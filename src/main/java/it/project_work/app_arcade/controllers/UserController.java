package it.project_work.app_arcade.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import it.project_work.app_arcade.dto.MeResponse;
import it.project_work.app_arcade.services.UserService;

@RestController
@RequestMapping("/api")
public class UserController {

	private final UserService userService;

	public UserController(UserService userService) {
		this.userService = userService;
	}

	@GetMapping("/me")
	public ResponseEntity<MeResponse> getMe(@RequestParam(required = false) Long userId) {
        Long currentUserId = userId != null ? userId : 1L;
        
        MeResponse me = userService.me(currentUserId);
        return ResponseEntity.ok(me);
    }

	@PutMapping("/me/avatar")
    public ResponseEntity<MeResponse> updateAvatar(
            @PathVariable Long userId,
            @RequestParam Long avatarId) {
        
        MeResponse me = userService.updateAvatar(userId, avatarId);
        return ResponseEntity.ok(me);
    }
}