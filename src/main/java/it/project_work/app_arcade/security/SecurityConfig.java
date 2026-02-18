package it.project_work.app_arcade.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import it.project_work.app_arcade.services.CustomUserDetailsService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                // pagine pubbliche
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
                        "/audio/**",
                        "/favicon.ico"
                ).permitAll()
                // API pubbliche 
                .requestMatchers("/api/leaderboard").permitAll()
                // API che richiedono login
                .requestMatchers("/api/game/score").authenticated()
                .requestMatchers("/api/profile/").authenticated()
                // tutto il resto autenticato
                .anyRequest().authenticated())
                .formLogin(form -> form
                .loginPage("/auth.html")
                .loginProcessingUrl("/login")
                .defaultSuccessUrl("/play.html", true)
                .permitAll())
                .logout(logout -> logout
                .logoutSuccessUrl("/")
                .permitAll());

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
