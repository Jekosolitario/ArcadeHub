package it.project_work.app_arcade.security;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();

        /*
         * allowedOrigins:
         * - DEVONO essere origini ESATTE (schema + host + porta).
         * - Non puoi usare "*" se vuoi allowCredentials(true),
         *   perché per specifica CORS il browser rifiuta cookie con "*".
         */
        cfg.setAllowedOrigins(List.of(
                "http://localhost:5173" // Vite dev server
        // aggiungi qui eventuali altre origini in dev
        // "http://localhost:5500" // Live Server (se lo usate)
        ));

        /*
         * allowCredentials(true):
         * - Permette l'uso di cookie/credenziali cross-origin.
         * - Senza questo, il browser NON manda JSESSIONID e NON lo salva.
         */
        cfg.setAllowCredentials(true);

        /*
         * Metodi permessi.
         * - In auth ti servono almeno GET/POST.
         */
        cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        /*
         * Header permessi:
         * - "Content-Type" serve per JSON
         * - in generale accettiamo tutto in dev
         */
        cfg.setAllowedHeaders(List.of("*"));

        /*
         * (Opzionale) Header esposti:
         * - se un giorno vuoi leggere header custom dal client.
         */
        // cfg.setExposedHeaders(List.of("Set-Cookie"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}

// Con questo, le richieste da localhost:5173 possono raggiungere il backend e i cookie possono viaggiare.
