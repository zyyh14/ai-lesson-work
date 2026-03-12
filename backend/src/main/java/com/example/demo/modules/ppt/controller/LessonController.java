package com.example.demo.controller;

import com.example.demo.dto.FrontendMessage;
import com.example.demo.dto.SyncLessonRequest;
import com.example.demo.model.ChatMessage;
import com.example.demo.model.Lesson;
import com.example.demo.repository.ChatMessageRepository;
import com.example.demo.repository.LessonRepository;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.*;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    private final LessonRepository lessonRepository;
    private final ChatMessageRepository chatMessageRepository;

    public LessonController(LessonRepository lessonRepository, ChatMessageRepository chatMessageRepository) {
        this.lessonRepository = lessonRepository;
        this.chatMessageRepository = chatMessageRepository;
    }

    private static Map<String, Object> toErrorBody(String path, Exception e) {
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("path", path);
        resp.put("exception", e.getClass().getName());
        resp.put("message", e.getMessage());
        StringWriter sw = new StringWriter();
        e.printStackTrace(new PrintWriter(sw));
        String trace = sw.toString();
        // Keep response bounded
        if (trace.length() > 12000) {
            trace = trace.substring(0, 12000) + "\n... (truncated)";
        }
        resp.put("trace", trace);
        return resp;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listLessons() {
        try {
            List<Lesson> lessons = lessonRepository.findAll();
            lessons.sort((a, b) -> {
                Long am = a.getLastModified() == null ? 0L : a.getLastModified();
                Long bm = b.getLastModified() == null ? 0L : b.getLastModified();
                return Long.compare(bm, am);
            });

            List<Map<String, Object>> out = new ArrayList<>();
            for (Lesson l : lessons) {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", String.valueOf(l.getId()));
                item.put("title", l.getTitle() == null ? "未命名课件" : l.getTitle());
                item.put("lastModified", l.getLastModified() == null ? System.currentTimeMillis() : l.getLastModified());
                out.add(item);
            }

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("lessons", out);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(toErrorBody("/api/lessons", e));
        }
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> createLesson() {
        try {
            long now = System.currentTimeMillis();
            long id = now;

            Lesson lesson = new Lesson();
            lesson.setId(id);
            lesson.setTitle("未命名课件");
            lesson.setSlidesData("{\"title\":\"未命名课件\",\"theme\":{\"id\":\"default\",\"name\":\"Minimal White\",\"backgroundColor\":\"#ffffff\",\"titleColor\":\"#1e293b\",\"textColor\":\"#475569\",\"accentColor\":\"#4f46e5\",\"fontFamily\":\"sans-serif\"},\"slides\":[]}");
            lesson.setMarkdownContent("");
            lesson.setVersion(1L);
            lesson.setLastModified(now);
            lessonRepository.save(lesson);

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("id", String.valueOf(lesson.getId()));
            resp.put("title", lesson.getTitle());
            resp.put("lastModified", lesson.getLastModified());
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(toErrorBody("/api/lessons", e));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLesson(@PathVariable("id") Long id) {
        try {
            chatMessageRepository.deleteByLessonId(id);
        } catch (Exception ignored) {
        }
        lessonRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping(value = "/{id}/title", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> renameLesson(@PathVariable("id") Long id, @RequestBody Map<String, Object> body) {
        try {
            Lesson lesson = lessonRepository.findById(id).orElse(null);
            if (lesson == null) return ResponseEntity.notFound().build();

            Object titleObj = body == null ? null : body.get("title");
            String title = titleObj == null ? null : String.valueOf(titleObj).trim();
            if (title == null || title.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            lesson.setTitle(title);
            lesson.setLastModified(System.currentTimeMillis());
            lessonRepository.save(lesson);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(toErrorBody("/api/lessons/" + id + "/title", e));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getLesson(@PathVariable("id") Long id) {
        try {
            Lesson lesson = lessonRepository.findById(id).orElseGet(() -> {
                Lesson l = new Lesson();
                l.setId(id);
                l.setTitle("未命名课件");
                l.setSlidesData("{\"title\":\"未命名课件\",\"theme\":{\"id\":\"default\",\"name\":\"Minimal White\",\"backgroundColor\":\"#ffffff\",\"titleColor\":\"#1e293b\",\"textColor\":\"#475569\",\"accentColor\":\"#4f46e5\",\"fontFamily\":\"sans-serif\"},\"slides\":[]}");
                l.setMarkdownContent("");
                l.setVersion(1L);
                l.setLastModified(System.currentTimeMillis());
                return lessonRepository.save(l);
            });

            List<ChatMessage> history = chatMessageRepository.findByLessonIdOrderByIdAsc(id);
            List<FrontendMessage> frontendHistory = new ArrayList<>();
            for (ChatMessage m : history) {
                FrontendMessage fm = new FrontendMessage();
                fm.setId(String.valueOf(m.getId()));
                fm.setText(m.getContent());
                fm.setSender(m.getSender());
                fm.setTimestamp(m.getTimestamp() == null ? System.currentTimeMillis() : m.getTimestamp());
                fm.setIsToolOutput(m.getIsToolOutput());
                frontendHistory.add(fm);
            }

            Map<String, Object> lessonObj = new LinkedHashMap<>();
            lessonObj.put("id", String.valueOf(lesson.getId()));
            lessonObj.put("slidesData", lesson.getSlidesData());
            lessonObj.put("markdownContent", lesson.getMarkdownContent());
            lessonObj.put("version", lesson.getVersion());
            lessonObj.put("title", lesson.getTitle());

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("lesson", lessonObj);
            resp.put("history", frontendHistory);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(toErrorBody("/api/lessons/" + id, e));
        }
    }

    @PostMapping("/{id}/sync")
    public ResponseEntity<Map<String, Object>> syncLesson(@PathVariable("id") Long id,
                                                         @RequestBody SyncLessonRequest req) {
        try {
            Lesson lesson = lessonRepository.findById(id).orElse(null);

            String derivedTitle = null;
            try {
                JsonNode node = new ObjectMapper().readTree(req.getSlidesData());
                String t = node.path("title").asText(null);
                if (t != null && !t.trim().isEmpty()) derivedTitle = t.trim();
            } catch (Exception ignored) {
            }

            if (lesson == null) {
                Lesson created = new Lesson();
                created.setId(id);
                created.setTitle(derivedTitle == null ? "未命名课件" : derivedTitle);
                created.setSlidesData(req.getSlidesData());
                created.setMarkdownContent(req.getMarkdownContent());
                created.setVersion(1L);
                created.setLastModified(System.currentTimeMillis());
                lessonRepository.save(created);

                Map<String, Object> ok = new HashMap<>();
                ok.put("version", created.getVersion());
                return ResponseEntity.ok(ok);
            }

            Long clientVersion = req.getVersion() == null ? 0L : req.getVersion();
            Long serverVersion = lesson.getVersion() == null ? 0L : lesson.getVersion();
            if (!Objects.equals(clientVersion, serverVersion)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Collections.singletonMap("message", "CONFLICT"));
            }

            lesson.setSlidesData(req.getSlidesData());
            lesson.setMarkdownContent(req.getMarkdownContent());
            if (derivedTitle != null) {
                lesson.setTitle(derivedTitle);
            }
            lesson.setVersion(serverVersion + 1);
            lesson.setLastModified(System.currentTimeMillis());
            lessonRepository.save(lesson);

            Map<String, Object> ok = new HashMap<>();
            ok.put("version", lesson.getVersion());
            return ResponseEntity.ok(ok);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(toErrorBody("/api/lessons/" + id + "/sync", e));
        }
    }

    @PostMapping("/{id}/chat")
    public ResponseEntity<?> saveChat(@PathVariable("id") Long id,
                                        @RequestBody FrontendMessage msg) {
        try {
            ChatMessage cm = new ChatMessage();
            cm.setLessonId(id);
            cm.setSender(msg.getSender());
            cm.setContent(msg.getText());
            cm.setTimestamp(msg.getTimestamp());
            cm.setIsToolOutput(msg.getIsToolOutput() != null && msg.getIsToolOutput());
            chatMessageRepository.save(cm);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(toErrorBody("/api/lessons/" + id + "/chat", e));
        }
    }
}