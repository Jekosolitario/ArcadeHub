package it.project_work.app_arcade.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import it.project_work.app_arcade.models.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
}