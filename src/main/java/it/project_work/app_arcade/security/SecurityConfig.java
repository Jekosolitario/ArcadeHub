package it.project_work.app_arcade.security;

import org.springframework.boot.security.autoconfigure.web.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        // 🔥 Static fuori dalla security chain => niente 403 su /assets/**
        return (web) -> web.ignoring().requestMatchers(
                PathRequest.toStaticResources().atCommonLocations()
        );
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                // pagine + asset pubblici
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
                        "/favicon.ico",
                        "/site.webmanifest",
                        "/audio/**",
                        "/health"
                ).permitAll()
                // auth pubbliche
                .requestMatchers("/auth/login", "/auth/register", "/auth/me", "/auth/logout").permitAll()
                // leaderboard pubbliche GET
                .requestMatchers(HttpMethod.GET,
                        "/api/leaderboard/global",
                        "/api/leaderboard/game/**",
                        "/api/leaderboard/games/codes",
                        "/api/leaderboard/flappy",
                        "/api/avatars"
                ).permitAll()
                .requestMatchers("/api/leaderboard/**").authenticated()
                // API protette
                .requestMatchers("/api/game/score").authenticated()
                .requestMatchers("/api/profile/**").authenticated()
                .requestMatchers("/api/game/progress").authenticated()
                .anyRequest().authenticated()
                )
                .formLogin(form -> form.disable())
                .logout(logout -> logout.disable());

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
