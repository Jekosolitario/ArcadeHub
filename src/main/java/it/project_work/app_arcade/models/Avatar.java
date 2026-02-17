package it.project_work.app_arcade.models;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(
    name = "avatars"
)
public class Avatar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(name = "image_url", nullable = false, length = 255)
    private String imageUrl;

    @Column(name = "required_level", nullable = false)
    private Integer requiredLevel = 1;

    @Column(nullable = false)
    private Boolean active = true;

    // getters & setters
}
