package it.project_work.app_arcade.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

	@GetMapping("/api/me")
	public String getMe() {
		return "me";
	}
}