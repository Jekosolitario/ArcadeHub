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
import it.project_work.app_arcade.exceptions.BadRequestException;
import it.project_work.app_arcade.repositories.UserRepository;
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
    private final UserRepository userRepository;

    public AuthController(AuthService authService,
            AuthenticationManager authenticationManager,
            SecurityContextRepository securityContextRepository,
            UserRepository userRepository) {
        this.authService = authService;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.userRepository = userRepository;
    }

    // Registrazione
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest dto) {
        UserResponse user = authService.register(dto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(new ApiResponse<>("Utente registrato", user));
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

            // salva in sessione (fondamentale per session+cookie JSESSIONID)
            securityContextRepository.saveContext(context, request, response);

            // recupero l'utente reale dal DB per risposta completa
            String username = auth.getName();
            var user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new BadRequestException("USER_NOT_FOUND", "Utente non trovato"));

            return ResponseEntity.ok(
                    new ApiResponse<>("Login OK", UserResponse.fromEntity(user))
            );

        } catch (BadCredentialsException ex) {
            // gestita dal GlobalExceptionHandler -> 401 JSON
            throw ex;
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request, HttpServletResponse response) {
        try {
            // 1) invalida sessione (server-side)
            var session = request.getSession(false);
            if (session != null) {
                session.invalidate(); // -> distrugge la sessione sul server → l’utente non è più autenticato.
            }

            // 2) pulisci SecurityContext (thread-local)
            SecurityContextHolder.clearContext(); // -> pulisce l’autenticazione dal thread corrente

            // 3) scade il cookie JSESSIONID (client-side) -> evita "cookie zombie"
            jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("JSESSIONID", "");
            cookie.setMaxAge(0); // -> dice al browser “cancella questo cookie” → niente residui.
            cookie.setPath("/"); // stesso path del cookie originale
            cookie.setHttpOnly(true);
            response.addCookie(cookie);

            return ResponseEntity.ok(new ApiResponse<>("Logout OK", null));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(new ApiResponse<>("Logout failed", null));
        }
    }

    // Profilo dell’utente loggato
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me(@AuthenticationPrincipal UserDetails userDetails) {
        // guest => 200 con data null (niente "rosso" in console)
        if (userDetails == null) {
            return ResponseEntity.ok(new ApiResponse<>("GUEST", null));
        }

        String username = userDetails.getUsername();

        var user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BadRequestException("USER_NOT_FOUND", "Utente non trovato"));

        return ResponseEntity.ok(new ApiResponse<>("OK", UserResponse.fromEntity(user)));
    }
}
