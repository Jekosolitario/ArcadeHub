package it.project_work.app_arcade.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import it.project_work.app_arcade.models.Avatar;

@Repository
public interface AvatarRepository extends JpaRepository<Avatar, Long> {

    List<Avatar> findAllByActiveTrueOrderByRequiredLevelAsc();
}
