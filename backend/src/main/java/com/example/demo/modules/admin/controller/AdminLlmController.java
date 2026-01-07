package com.example.demo.modules.admin.controller;

import com.example.demo.modules.admin.dto.AdminCreateProviderRequest;
import com.example.demo.modules.admin.dto.AdminUpdateProviderRequest;
import com.example.demo.modules.admin.entity.LlmProvider;
import com.example.demo.modules.admin.entity.LlmUsage;
import com.example.demo.modules.admin.repository.LlmProviderRepository;
import com.example.demo.modules.admin.repository.LlmUsageRepository;
import com.example.demo.modules.admin.service.AdminAuditService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TimeZone;
import java.util.TreeMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/llm")
public class AdminLlmController {

    private final LlmProviderRepository llmProviderRepository;
    private final LlmUsageRepository llmUsageRepository;
    private final AdminAuditService adminAuditService;

    public AdminLlmController(LlmProviderRepository llmProviderRepository, LlmUsageRepository llmUsageRepository, AdminAuditService adminAuditService) {
        this.llmProviderRepository = llmProviderRepository;
        this.llmUsageRepository = llmUsageRepository;
        this.adminAuditService = adminAuditService;
    }

    @GetMapping("/providers")
    public Map<String, Object> providers() {
        List<LlmProvider> all = llmProviderRepository.findAll();
        all.sort((a, b) -> Long.compare(b.getCreatedAt(), a.getCreatedAt()));

        List<Map<String, Object>> providers = all.stream().map(p -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", p.getId());
            item.put("name", p.getName());
            item.put("base_url", p.getBaseUrl());
            item.put("model", p.getModel());
            item.put("active", p.isActive());
            item.put("builtIn", p.getBuiltIn() != null && p.getBuiltIn());
            item.put("createdAt", p.getCreatedAt());
            item.put("updatedAt", p.getUpdatedAt());
            return item;
        }).collect(Collectors.toList());

        Long activeId = null;
        for (LlmProvider p : all) {
            if (p.isActive()) {
                activeId = p.getId();
                break;
            }
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("providers", providers);
        if (activeId != null) {
            resp.put("activeProviderId", activeId);
        }
        return resp;
    }

    @PostMapping("/providers")
    public ResponseEntity<?> createProvider(@RequestBody AdminCreateProviderRequest request, javax.servlet.http.HttpServletRequest http) {
        if (request == null
                || request.getName() == null || request.getName().trim().isEmpty()
                || request.getBaseUrl() == null || request.getBaseUrl().trim().isEmpty()
                || request.getModel() == null || request.getModel().trim().isEmpty()) {
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("message", "name/baseUrl/model required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(resp);
        }

        LlmProvider p = new LlmProvider();
        p.setName(request.getName().trim());
        p.setBaseUrl(request.getBaseUrl().trim());
        p.setModel(request.getModel().trim());
        p.setApiKey(request.getApiKey());
        p.setActive(false);
        p.setBuiltIn(false);

        LlmProvider saved = llmProviderRepository.save(p);

        try {
            String actor = http == null ? null : (String) http.getAttribute("adminActor");
            adminAuditService.record(actor, "llm_provider_create", "llm_provider", String.valueOf(saved.getId()), "name=" + saved.getName() + ", model=" + saved.getModel(), http == null ? null : http.getRemoteAddr());
        } catch (Exception ignored) {
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("id", saved.getId());
        resp.put("name", saved.getName());
        resp.put("base_url", saved.getBaseUrl());
        resp.put("model", saved.getModel());
        resp.put("active", saved.isActive());
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @DeleteMapping("/providers/{id}")
    public ResponseEntity<?> deleteProvider(@PathVariable("id") Long id, javax.servlet.http.HttpServletRequest http) {
        Optional<LlmProvider> opt = llmProviderRepository.findById(id);
        if (!opt.isPresent()) {
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("message", "provider not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(resp);
        }

        LlmProvider p = opt.get();
        if (p.getBuiltIn() != null && p.getBuiltIn()) {
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("message", "built-in provider cannot be deleted");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(resp);
        }

        llmProviderRepository.deleteById(id);

        try {
            String actor = http == null ? null : (String) http.getAttribute("adminActor");
            adminAuditService.record(actor, "llm_provider_delete", "llm_provider", String.valueOf(id), "name=" + p.getName(), http == null ? null : http.getRemoteAddr());
        } catch (Exception ignored) {
        }

        return ResponseEntity.ok().build();
    }

    @PatchMapping("/providers/{id}")
    public ResponseEntity<?> updateProvider(@PathVariable("id") Long id, @RequestBody AdminUpdateProviderRequest request, javax.servlet.http.HttpServletRequest http) {
        Optional<LlmProvider> opt = llmProviderRepository.findById(id);
        if (!opt.isPresent()) {
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("message", "provider not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(resp);
        }

        LlmProvider p = opt.get();
        if (request != null) {
            if (request.getName() != null && !request.getName().trim().isEmpty()) {
                p.setName(request.getName().trim());
            }
            if (request.getBaseUrl() != null && !request.getBaseUrl().trim().isEmpty()) {
                p.setBaseUrl(request.getBaseUrl().trim());
            }
            if (request.getModel() != null && !request.getModel().trim().isEmpty()) {
                p.setModel(request.getModel().trim());
            }
            if (request.getApiKey() != null) {
                p.setApiKey(request.getApiKey());
            }
        }

        llmProviderRepository.save(p);

        try {
            String actor = http == null ? null : (String) http.getAttribute("adminActor");
            adminAuditService.record(actor, "llm_provider_update", "llm_provider", String.valueOf(p.getId()), "name=" + p.getName() + ", model=" + p.getModel(), http == null ? null : http.getRemoteAddr());
        } catch (Exception ignored) {
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("id", p.getId());
        resp.put("name", p.getName());
        resp.put("base_url", p.getBaseUrl());
        resp.put("model", p.getModel());
        resp.put("active", p.isActive());
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/providers/{id}/activate")
    public ResponseEntity<?> activate(@PathVariable("id") Long id, javax.servlet.http.HttpServletRequest http) {
        Optional<LlmProvider> opt = llmProviderRepository.findById(id);
        if (!opt.isPresent()) {
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("message", "provider not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(resp);
        }

        List<LlmProvider> active = llmProviderRepository.findAllByActive(true);
        for (LlmProvider p : active) {
            if (!p.getId().equals(id)) {
                p.setActive(false);
                llmProviderRepository.save(p);
            }
        }

        LlmProvider target = opt.get();
        target.setActive(true);
        llmProviderRepository.save(target);

        try {
            String actor = http == null ? null : (String) http.getAttribute("adminActor");
            adminAuditService.record(actor, "llm_provider_activate", "llm_provider", String.valueOf(target.getId()), "name=" + target.getName(), http == null ? null : http.getRemoteAddr());
        } catch (Exception ignored) {
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("activeProviderId", target.getId());
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/usage")
    public Map<String, Object> usage() {
        List<LlmUsage> all = llmUsageRepository.findAll();

        long totalTokens = 0L;
        for (LlmUsage u : all) {
            if (u.getTotalTokens() != null) {
                totalTokens += u.getTotalTokens();
            }
        }

        long now = System.currentTimeMillis();
        long from = now - 30L * 24L * 60L * 60L * 1000L;
        String todayKey = formatDay(now);

        Map<String, Long> dailyMap = new TreeMap<>();
        for (LlmUsage u : all) {
            long ts = u.getCreatedAt();
            if (ts < from) continue;
            String day = formatDay(ts);
            Long tokens = u.getTotalTokens();
            long add = tokens == null ? 0L : tokens;
            dailyMap.put(day, dailyMap.getOrDefault(day, 0L) + add);
        }

        Map<String, long[]> moduleAgg = new LinkedHashMap<>();
        for (LlmUsage u : all) {
            if (!u.isSuccess()) continue;
            String module = detectModule(u.getEndpoint());
            long[] v = moduleAgg.computeIfAbsent(module, k -> new long[]{0L, 0L});
            long add = u.getTotalTokens() == null ? 0L : u.getTotalTokens();
            v[0] += add;
            if (todayKey.equals(formatDay(u.getCreatedAt()))) {
                v[1] += add;
            }
        }

        List<Map<String, Object>> moduleBreakdown = moduleAgg.entrySet().stream().map(e -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("module", e.getKey());
            item.put("totalTokens", e.getValue()[0]);
            item.put("todayTokens", e.getValue()[1]);
            return item;
        }).collect(Collectors.toList());

        List<Map<String, Object>> daily = dailyMap.entrySet().stream().map(e -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("day", e.getKey());
            item.put("tokens", e.getValue());
            return item;
        }).collect(Collectors.toList());

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("totalTokens", totalTokens);
        resp.put("daily", daily);
        resp.put("monthly", Collections.emptyList());
        resp.put("moduleBreakdown", moduleBreakdown);
        return resp;
    }

    private static String detectModule(String endpoint) {
        String e = endpoint == null ? "" : endpoint;
        if (e.contains("/lesson-plan")) return "lessonplan";
        if (e.contains("/api/ai/") || e.contains("/chat/completions")) return "ppt";
        if (e.contains("/resources") || e.contains("/exercises") || e.contains("python")) return "resource";
        if (e.contains("study") || e.contains("analysis")) return "study_analysis";
        return "other";
    }

    private static String formatDay(long ts) {
        java.util.Calendar cal = java.util.Calendar.getInstance(TimeZone.getDefault());
        cal.setTimeInMillis(ts);
        int y = cal.get(java.util.Calendar.YEAR);
        int m = cal.get(java.util.Calendar.MONTH) + 1;
        int d = cal.get(java.util.Calendar.DAY_OF_MONTH);
        String mm = m < 10 ? ("0" + m) : String.valueOf(m);
        String dd = d < 10 ? ("0" + d) : String.valueOf(d);
        return y + "-" + mm + "-" + dd;
    }
}
