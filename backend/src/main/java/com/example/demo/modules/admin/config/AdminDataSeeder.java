package com.example.demo.modules.admin.config;

import com.example.demo.modules.admin.entity.LlmProvider;
import com.example.demo.modules.admin.entity.TeacherUser;
import com.example.demo.modules.admin.repository.LlmProviderRepository;
import com.example.demo.modules.admin.repository.TeacherUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AdminDataSeeder implements CommandLineRunner {

    private final TeacherUserRepository teacherUserRepository;
    private final LlmProviderRepository llmProviderRepository;

    @Value("${ark.baseUrl:}")
    private String arkBaseUrl;

    @Value("${ark.apiKey:}")
    private String arkApiKey;

    @Value("${ark.defaultModel:}")
    private String arkDefaultModel;

    @Value("${ark.thinkingModel:}")
    private String arkThinkingModel;

    @Value("${ark.visionModel:}")
    private String arkVisionModel;

    @Value("${lessonplan.ark.baseUrl:}")
    private String lessonplanArkBaseUrl;

    @Value("${lessonplan.ark.apiKey:}")
    private String lessonplanArkApiKey;

    @Value("${lessonplan.ark.model:}")
    private String lessonplanArkModel;

    @Value("${lessonplan.ark.visionModel:}")
    private String lessonplanArkVisionModel;

    public AdminDataSeeder(TeacherUserRepository teacherUserRepository, LlmProviderRepository llmProviderRepository) {
        this.teacherUserRepository = teacherUserRepository;
        this.llmProviderRepository = llmProviderRepository;
    }

    @Override
    public void run(String... args) {
        seedTeacherUsers();
        seedProviders();
    }

    private void seedTeacherUsers() {
        try {
            // unified admin account
            if (!teacherUserRepository.findByUsername("admin").isPresent()) {
                TeacherUser admin = new TeacherUser();
                admin.setUsername("admin");
                admin.setPassword("admin123");
                admin.setActive(true);
                admin.setRole("admin");
                teacherUserRepository.save(admin);
            }

            if (!teacherUserRepository.findByUsername("teacher").isPresent()) {
                TeacherUser u = new TeacherUser();
                u.setUsername("teacher");
                u.setPassword("123456");
                u.setActive(true);
                u.setRole("teacher");
                teacherUserRepository.save(u);
            }

            if (!teacherUserRepository.findByUsername("teacher1").isPresent()) {
                TeacherUser u = new TeacherUser();
                u.setUsername("teacher1");
                u.setPassword("123456");
                u.setActive(true);
                u.setRole("teacher");
                teacherUserRepository.save(u);
            }

            if (!teacherUserRepository.findByUsername("teacher2").isPresent()) {
                TeacherUser u = new TeacherUser();
                u.setUsername("teacher2");
                u.setPassword("123456");
                u.setActive(true);
                u.setRole("teacher");
                teacherUserRepository.save(u);
            }
        } catch (Exception ignored) {
        }
    }

    private void seedProviders() {
        try {
            // PPT (Ark)
            String pptBaseUrl = safe(arkBaseUrl);
            if (pptBaseUrl.isEmpty()) pptBaseUrl = "https://ark.cn-beijing.volces.com/api/v3";
            String pptApiKey = safe(arkApiKey);
            String pptDefaultModel = safe(arkDefaultModel);
            if (pptDefaultModel.isEmpty()) pptDefaultModel = "deepseek-v3-250324";

            upsertBuiltIn("PPT-AI 默认(Ark)", pptBaseUrl, pptDefaultModel, pptApiKey);

            String pptThinking = safe(arkThinkingModel);
            if (!pptThinking.isEmpty()) {
                upsertBuiltIn("PPT-AI 思考模型(Ark)", pptBaseUrl, pptThinking, pptApiKey);
            }
            String pptVision = safe(arkVisionModel);
            if (!pptVision.isEmpty()) {
                upsertBuiltIn("PPT-AI 视觉模型(Ark)", pptBaseUrl, pptVision, pptApiKey);
            }

            // LessonPlan (Ark)
            String lpBaseUrl = safe(lessonplanArkBaseUrl);
            if (!lpBaseUrl.isEmpty()) {
                String lpApiKey = safe(lessonplanArkApiKey);
                String lpModel = safe(lessonplanArkModel);
                if (!lpModel.isEmpty()) {
                    upsertBuiltIn("教案-AI 默认(Ark)", lpBaseUrl, lpModel, lpApiKey);
                }
                String lpVision = safe(lessonplanArkVisionModel);
                if (!lpVision.isEmpty()) {
                    upsertBuiltIn("教案-AI 视觉模型(Ark)", lpBaseUrl, lpVision, lpApiKey);
                }
            }

            // Python Service (Zhipu)
            upsertBuiltIn("资源/练习-AI(智谱)", "python_service", "glm-4", "");

            // Resource (Python)
            upsertBuiltIn("资源模块-Python 服务", safe("${python.service.url:http://localhost:5000}"), "python", "");

            // Study analysis (placeholder display)
            upsertBuiltIn("学情分析-AI", pptBaseUrl, pptDefaultModel, pptApiKey);

            // Legacy: keep existing behavior, ensure there is at least one active row for older data
            List<LlmProvider> active = llmProviderRepository.findAllByActive(true);
            if (active.isEmpty()) {
                List<LlmProvider> all = llmProviderRepository.findAll();
                if (!all.isEmpty()) {
                    LlmProvider first = all.get(0);
                    first.setActive(true);
                    llmProviderRepository.save(first);
                }
            }
        } catch (Exception ignored) {
        }
    }

    private void upsertBuiltIn(String name, String baseUrl, String model, String apiKey) {
        LlmProvider p = llmProviderRepository.findByName(name).orElseGet(LlmProvider::new);
        p.setName(name);
        p.setBaseUrl(baseUrl);
        p.setModel(model);
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            p.setApiKey(apiKey.trim());
        }
        p.setBuiltIn(true);
        llmProviderRepository.save(p);
    }

    private static String safe(String v) {
        return v == null ? "" : v.trim();
    }
}
