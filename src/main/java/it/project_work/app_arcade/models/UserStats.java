package it.project_work.app_arcade.models;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_stats")
public class UserStats {

    @Id
    private Long userId;

    @MapsId
    @OneToOne   
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private int level = 1;

    @Column(nullable = false)
    private int totalPoints = 0;

    @ManyToOne
    @JoinColumn(name = "selected_avatar_id")
    private Avatar selectedAvatar;

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    // getters & setters
}

