package com.example.demo.modules.admin.repository;

import com.example.demo.modules.admin.entity.AdminOpLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminOpLogRepository extends JpaRepository<AdminOpLog, Long> {
    Page<AdminOpLog> findByActor(String actor, Pageable pageable);
    Page<AdminOpLog> findByAction(String action, Pageable pageable);
}
