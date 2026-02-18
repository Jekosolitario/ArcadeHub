package it.project_work.app_arcade.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
                // se FE e BE sono su origin diverse serve poi CorsConfigurationSource
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                // Pagine HTML pubbliche: così il guard.js può gestire redirect UX
                .requestMatchers(
                        "/",
                        "/index.html",
                        "/play.html",
                        "/auth.html",
                        "/leaderboard.html",
                        "/profile.html",
                        // assets statici
                        "/css/**",
                        "/js/**",
                        "/assets/**",
                        "/images/**",
                        "/partials/**",
                        "/audio/**"
                ).permitAll()
                // AUTH API pubbliche (così /auth/me non fa 403 "brutto" da Security)
                .requestMatchers("/auth/login", "/auth/register", "/auth/me", "/auth/logout").permitAll()
                // API pubbliche
                .requestMatchers("/api/leaderboard").permitAll()
                // API protette (qui si applica la vera sicurezza)
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
