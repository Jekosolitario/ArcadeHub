package it.project_work.app_arcade.models;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(
    name = "user_game_progress"
)
public class UserGameProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "user_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_progress_user")
    )
    private User user;

    @Column(name = "game_code", nullable = false, length = 20)
    private String gameCode;

    @Column(name = "best_score", nullable = false)
    private Integer bestScore = 0;

    @Column(name = "last_score", nullable = false)
    private Integer lastScore = 0;

    @Column(name = "played_count", nullable = false)
    private Integer playedCount = 0;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }

    // getters & setters
}

