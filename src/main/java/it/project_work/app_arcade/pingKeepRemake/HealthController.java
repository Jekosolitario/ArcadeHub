package it.project_work.app_arcade.pingKeepRemake;

import java.time.Instant;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private final JdbcTemplate jdbc;

    public HealthController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        boolean dbUp;
        try {
            jdbc.queryForObject("SELECT 1", Integer.class);
            dbUp = true;
        } catch (Exception e) {
            dbUp = false;
        }

        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "db", dbUp ? "UP" : "DOWN",
                "timestamp", Instant.now().toString()
        ));
    }
}
