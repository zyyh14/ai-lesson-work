package com.example.demo.controller;

import com.example.demo.dto.SubmitFeedbackRequest;
import com.example.demo.modules.admin.entity.FeedbackTicket;
import com.example.demo.modules.admin.repository.FeedbackTicketRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackTicketRepository feedbackTicketRepository;

    public FeedbackController(FeedbackTicketRepository feedbackTicketRepository) {
        this.feedbackTicketRepository = feedbackTicketRepository;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> submit(@RequestBody SubmitFeedbackRequest req) {
        String content = req == null ? null : req.getContent();
        if (content == null || content.trim().isEmpty()) {
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("message", "content is required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(resp);
        }

        FeedbackTicket t = new FeedbackTicket();
        t.setUsername(req.getUsername() == null ? "unknown" : req.getUsername());
        t.setName(req.getName() == null ? "" : req.getName());
        t.setContent(content.trim());
        t.setStatus("open");
        FeedbackTicket saved = feedbackTicketRepository.save(t);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("id", saved.getId());
        resp.put("status", saved.getStatus());
        return ResponseEntity.ok(resp);
    }
}
