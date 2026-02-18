package it.project_work.app_arcade.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import it.project_work.app_arcade.dto.ApiResponse;
import it.project_work.app_arcade.dto.LoginRequest;
import it.project_work.app_arcade.dto.RegisterRequest;
import it.project_work.app_arcade.dto.UserResponse;
import it.project_work.app_arcade.services.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;

    public AuthController(AuthService authService,
            AuthenticationManager authenticationManager,
            SecurityContextRepository securityContextRepository) {
        this.authService = authService;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
    }

    // Registrazione
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest dto) {
        var user = authService.register(dto);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(new ApiResponse<>("Utente registrato", UserResponse.fromEntity(user)));
    }

    // LOGIN custom: crea sessione + cookie JSESSIONID
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserResponse>> login(
            @Valid @RequestBody LoginRequest dto,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        try {
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(dto.username(), dto.password())
            );

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(auth);
            SecurityContextHolder.setContext(context);

            // salva in sessione (fondamentale per session+cookie)
            securityContextRepository.saveContext(context, request, response);

            // qui puoi anche ritornare info utente dal DB se vuoi
            // per ora ritorniamo username dalla principal
            String username = auth.getName();

            return ResponseEntity.ok(
                    new ApiResponse<>("Login OK",
                            new UserResponse(null, username, null, null, 1, true, null))
            );

        } catch (BadCredentialsException ex) {
            // verrà gestita dall'exception handler (Step 3.3) se preferisci
            throw ex;
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request, HttpServletResponse response) throws Exception {
        request.logout(); // invalida auth/session secondo config
        return ResponseEntity.ok(new ApiResponse<>("Logout OK", null));
    }

    // Profilo dell’utente loggato
    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body("Non loggato");
        }
        return ResponseEntity.ok(userDetails.getUsername());
    }
}
