package com.example.demo.modules.admin.repository;

import com.example.demo.modules.admin.entity.LlmUsage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LlmUsageRepository extends JpaRepository<LlmUsage, Long> {
}
