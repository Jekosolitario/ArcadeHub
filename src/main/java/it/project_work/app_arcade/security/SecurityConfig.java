package it.project_work.app_arcade.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // fetch + session cookie, senza CSRF token
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                // =========================
                // Pagine / asset pubblici
                // =========================
                .requestMatchers(
                        "/",
                        "/index.html",
                        "/play.html",
                        "/auth.html",
                        "/leaderboard.html",
                        "/profile.html",
                        "/css/**",
                        "/js/**",
                        "/assets/**",
                        "/images/**",
                        "/partials/**",
                        "/audio/**"
                ).permitAll()
                // =========================
                // AUTH API pubbliche
                // =========================
                .requestMatchers("/auth/login", "/auth/register", "/auth/me", "/auth/logout").permitAll()
                // =========================
                // LEADERBOARD API pubbliche (solo GET)
                // così la Top5 in home funziona da guest
                // =========================
                .requestMatchers(HttpMethod.GET,
                        "/api/leaderboard/global",
                        "/api/leaderboard/game/**",
                        "/api/leaderboard/games/codes",
                        "/api/leaderboard/flappy"
                ).permitAll()
                // Se vuoi essere più “strettissimo”:
                // tutto il resto sotto /api/leaderboard richiede login
                .requestMatchers("/api/leaderboard/**").authenticated()
                // =========================
                // API protette (vera sicurezza)
                // =========================
                .requestMatchers("/api/game/score").authenticated()
                .requestMatchers("/api/profile/**").authenticated()
                // tutto il resto autenticato
                .anyRequest().authenticated()
                )
                // login JSON custom, quindi niente formLogin
                .formLogin(form -> form.disable())
                // logout gestito dal controller
                .logout(logout -> logout.disable());

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
