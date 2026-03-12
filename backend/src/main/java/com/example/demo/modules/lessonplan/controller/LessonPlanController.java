package com.example.demo.modules.lessonplan.controller;

import com.example.demo.modules.lessonplan.dto.LessonPlanRequest;
import com.example.demo.modules.lessonplan.dto.LessonPlanHistoryDetail;
import com.example.demo.modules.lessonplan.dto.LessonPlanHistoryItem;
import com.example.demo.modules.lessonplan.entity.LessonPlanRecord;
import com.example.demo.modules.lessonplan.repository.LessonPlanRecordRepository;
import com.example.demo.modules.lessonplan.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@Validated
public class LessonPlanController {

    private final GeminiService geminiService;
    private final LessonPlanRecordRepository lessonPlanRecordRepository;

    public LessonPlanController(GeminiService geminiService, LessonPlanRecordRepository lessonPlanRecordRepository) {
        this.geminiService = geminiService;
        this.lessonPlanRecordRepository = lessonPlanRecordRepository;
    }

    @PostMapping("/lesson-plan")
    public ResponseEntity<Map<String, Object>> generate(@Valid @RequestBody LessonPlanRequest request) {
        String result = geminiService.generateLessonPlan(request);

        LessonPlanRecord record = new LessonPlanRecord();
        record.setSubject(request.getSubject());
        record.setGradeLevel(request.getGradeLevel());
        record.setTopic(request.getTopic());
        record.setDuration(request.getDuration());
        record.setObjectives(request.getObjectives());
        record.setAdditionalNotes(request.getAdditionalNotes());
        record.setHasTemplate(request.getTemplateImage() != null && !request.getTemplateImage().trim().isEmpty());
        record.setContentHtml(result);
        LessonPlanRecord saved = lessonPlanRecordRepository.save(record);

        Map<String, Object> resp = new HashMap<>();
        resp.put("data", result);
        resp.put("id", saved.getId());
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/lesson-plans")
    public ResponseEntity<List<LessonPlanHistoryItem>> list(@RequestParam(name = "limit", defaultValue = "20") int limit) {
        int safeLimit = Math.max(1, Math.min(100, limit));
        List<LessonPlanRecord> page = lessonPlanRecordRepository
                .findAll(PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.DESC, "id")))
                .getContent();

        List<LessonPlanHistoryItem> items = new ArrayList<>();
        for (LessonPlanRecord r : page) {
            LessonPlanHistoryItem item = new LessonPlanHistoryItem();
            item.setId(r.getId());
            item.setCreatedAt(r.getCreatedAt());
            item.setSubject(r.getSubject());
            item.setGradeLevel(r.getGradeLevel());
            item.setTopic(r.getTopic());
            item.setHasTemplate(r.isHasTemplate());
            items.add(item);
        }
        return ResponseEntity.ok(items);
    }

    @GetMapping("/lesson-plans/{id}")
    public ResponseEntity<LessonPlanHistoryDetail> detail(@PathVariable("id") Long id) {
        Optional<LessonPlanRecord> found = lessonPlanRecordRepository.findById(id);
        if (!found.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        LessonPlanRecord r = found.get();

        LessonPlanRequest req = new LessonPlanRequest();
        req.setSubject(r.getSubject());
        req.setGradeLevel(r.getGradeLevel());
        req.setTopic(r.getTopic());
        req.setDuration(r.getDuration());
        req.setObjectives(r.getObjectives());
        req.setAdditionalNotes(r.getAdditionalNotes());
        req.setTemplateImage(null);

        LessonPlanHistoryDetail detail = new LessonPlanHistoryDetail();
        detail.setId(r.getId());
        detail.setCreatedAt(r.getCreatedAt());
        detail.setRequest(req);
        detail.setData(r.getContentHtml());

        return ResponseEntity.ok(detail);
    }

    @DeleteMapping("/lesson-plans/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable("id") Long id) {
        if (!lessonPlanRecordRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        lessonPlanRecordRepository.deleteById(id);
        Map<String, Object> resp = new HashMap<>();
        resp.put("status", "deleted");
        resp.put("id", id);
        return ResponseEntity.ok(resp);
    }
}
