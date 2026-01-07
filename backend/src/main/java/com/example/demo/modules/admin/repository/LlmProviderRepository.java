package com.example.demo.modules.admin.repository;

import com.example.demo.modules.admin.entity.LlmProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LlmProviderRepository extends JpaRepository<LlmProvider, Long> {
    List<LlmProvider> findAllByActive(boolean active);

    Optional<LlmProvider> findByName(String name);
}
