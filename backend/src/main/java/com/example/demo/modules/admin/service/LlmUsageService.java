package com.example.demo.modules.admin.service;

import com.example.demo.modules.admin.entity.LlmUsage;
import com.example.demo.modules.admin.repository.LlmUsageRepository;
import org.springframework.stereotype.Service;

@Service
public class LlmUsageService {

    private final LlmUsageRepository llmUsageRepository;

    public LlmUsageService(LlmUsageRepository llmUsageRepository) {
        this.llmUsageRepository = llmUsageRepository;
    }

    public void recordSuccess(String endpoint, String model, Long promptTokens, Long completionTokens, Long totalTokens, Long latencyMs) {
        LlmUsage u = new LlmUsage();
        u.setEndpoint(endpoint);
        u.setModel(model == null ? "" : model);
        u.setSuccess(true);
        u.setPromptTokens(promptTokens);
        u.setCompletionTokens(completionTokens);
        u.setTotalTokens(totalTokens);
        u.setLatencyMs(latencyMs);
        llmUsageRepository.save(u);
    }

    public void recordFailure(String endpoint, String model, String error, Long latencyMs) {
        LlmUsage u = new LlmUsage();
        u.setEndpoint(endpoint);
        u.setModel(model == null ? "" : model);
        u.setSuccess(false);
        u.setError(error);
        u.setLatencyMs(latencyMs);
        llmUsageRepository.save(u);
    }
}
