package it.project_work.app_arcade.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

@Configuration
public class SecurityBeans {

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }
}
/* 
AuthenticationManager: è il componente che Spring usa per verificare username/password usando:
CustomUserDetailsService (carica l’utente dal DB)
PasswordEncoder (confronta password in chiaro vs hash BCrypt)

HttpSessionSecurityContextRepository: è il pezzo che permette la sessione vera:
dopo authenticate() tu metti l’auth nel SecurityContext
con saveContext(context, request, response) lo salvi in HttpSession

il browser mantiene la sessione tramite cookie JSESSIONID
 */
