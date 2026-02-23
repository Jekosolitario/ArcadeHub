package it.project_work.app_arcade.services;

import it.project_work.app_arcade.dto.FeedbackCreateRequest;
import it.project_work.app_arcade.models.Feedback;
import it.project_work.app_arcade.models.User;
import it.project_work.app_arcade.repositories.FeedbackRepository;
import it.project_work.app_arcade.repositories.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;

    public FeedbackService(FeedbackRepository feedbackRepository, UserRepository userRepository) {
        this.feedbackRepository = feedbackRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void create(FeedbackCreateRequest req, Authentication auth) {
        // 1) risolvo utente loggato (robusto: username o email)
        String principal = auth.getName();

        User user = userRepository.findByUsername(principal)
                .or(() -> userRepository.findByEmail(principal))
                .orElseThrow(() -> new IllegalStateException("Utente autenticato non trovato"));

        // 2) default type
        Feedback.Type type = (req.type() != null) ? req.type() : Feedback.Type.BUG;

        // 3) costruisco entity
        Feedback feedback = new Feedback();
        feedback.setType(type);
        feedback.setEmail(req.email().trim());
        feedback.setMessage(req.message().trim());
        feedback.setPage(req.page());
        feedback.setUserAgent(req.userAgent());
        feedback.setUser(user); // ManyToOne obbligatoria

        feedbackRepository.save(feedback);
    }
}
