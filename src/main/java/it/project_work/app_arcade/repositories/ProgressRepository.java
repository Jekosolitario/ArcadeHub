package it.project_work.app_arcade.repositories;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import it.project_work.app_arcade.models.UserGameProgress;

@Repository
public interface ProgressRepository extends JpaRepository<UserGameProgress, Long> {
    Optional<UserGameProgress> findByUserIdAndGameCode(Long userId, String gameCode);

    List<UserGameProgress> findByUserId(Long userId);

    List<UserGameProgress> findTopByGameCodeOrderByBestScoreDesc(String gameCode, PageRequest of);
}
