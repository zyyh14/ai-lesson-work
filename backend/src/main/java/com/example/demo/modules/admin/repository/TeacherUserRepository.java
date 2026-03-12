package com.example.demo.modules.admin.repository;

import com.example.demo.modules.admin.entity.TeacherUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TeacherUserRepository extends JpaRepository<TeacherUser, Long> {
    Optional<TeacherUser> findByUsername(String username);

    Page<TeacherUser> findAllByActive(boolean active, Pageable pageable);
}
