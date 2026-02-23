package it.project_work.app_arcade.repositories;

// package ...feedback;
import org.springframework.data.jpa.repository.JpaRepository;

import it.project_work.app_arcade.models.Feedback;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {}
