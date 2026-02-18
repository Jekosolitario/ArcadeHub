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
                // Per far funzionare subito fetch/session senza CSRF token
                .csrf(csrf -> csrf.disable())
                // Se FE e BE sono su origin diverse serve un bean CorsConfigurationSource
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                // pagine + asset pubblici
                .requestMatchers(
                        "/",
                        "/index.html",
                        "/play.html",
                        "/auth.html",
                        "/css/**",
                        "/js/**",
                        "/assets/**",
                        "/images/**",
                        "/partials/**",
                        "/audio/**"
                ).permitAll()
                // AUTH API
                .requestMatchers("/auth/login", "/auth/register").permitAll()
                .requestMatchers("/auth/me", "/auth/logout").authenticated()
                // API pubbliche
                .requestMatchers("/api/leaderboard").permitAll()
                // API protette
                .requestMatchers("/api/game/score").authenticated()
                .requestMatchers("/api/profile/**").authenticated()
                // tutto il resto autenticato
                .anyRequest().authenticated()
                )
                //  non usare formLogin se fai login JSON custom
                .formLogin(form -> form.disable())
                // Logout lo gestisci via controller (/auth/logout) con request.logout()
                .logout(logout -> logout.disable());

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
