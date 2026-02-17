package it.project_work.app_arcade.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import it.project_work.app_arcade.models.User;
import it.project_work.app_arcade.repository.UserRepository;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Registrazione
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {

        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Username già usato");
        }

        // Cripta la password
        user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
        user.setRole(User.Role.USER);
        user.setEnabled(true);

        // Imposta createdAt/updatedAt se non ci sono @PrePersist (opzionale)
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);

        return ResponseEntity.ok("Utente registrato");
    }

    // Profilo dell’utente loggato
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Non loggato");
        }
        return ResponseEntity.ok(userDetails.getUsername());
    }
}
