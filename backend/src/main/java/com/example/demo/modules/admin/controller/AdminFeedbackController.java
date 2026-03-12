package com.example.demo.modules.admin.controller;

import com.example.demo.modules.admin.entity.FeedbackTicket;
import com.example.demo.modules.admin.repository.FeedbackTicketRepository;
import com.example.demo.modules.admin.service.AdminAuditService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/feedback")
public class AdminFeedbackController {

    private final FeedbackTicketRepository feedbackTicketRepository;
    private final AdminAuditService adminAuditService;

    public AdminFeedbackController(FeedbackTicketRepository feedbackTicketRepository, AdminAuditService adminAuditService) {
        this.feedbackTicketRepository = feedbackTicketRepository;
        this.adminAuditService = adminAuditService;
    }

    @GetMapping
    public Map<String, Object> listFeedback(
            @RequestParam(value = "page", required = false, defaultValue = "1") Integer page,
            @RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit,
            @RequestParam(value = "status", required = false) String status
    ) {
        int p = page == null || page < 1 ? 0 : page - 1;
        int l = limit == null || limit < 1 ? 20 : Math.min(limit, 100);

        PageRequest pageable = PageRequest.of(p, l, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<FeedbackTicket> ticketsPage;

        String s = status == null ? null : status.trim();
        if (s == null || s.isEmpty() || "all".equalsIgnoreCase(s)) {
            ticketsPage = feedbackTicketRepository.findAll(pageable);
        } else {
            ticketsPage = feedbackTicketRepository.findByStatus(s, pageable);
        }

        List<Map<String, Object>> tickets = ticketsPage.getContent().stream().map(t -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", t.getId());
            item.put("title", "反馈");
            item.put("status", t.getStatus());
            item.put("username", t.getUsername());
            item.put("name", t.getName());
            item.put("content", t.getContent());
            item.put("adminReply", t.getAdminReply());
            item.put("adminRepliedAt", t.getAdminRepliedAt());
            item.put("createdAt", t.getCreatedAt());
            item.put("updatedAt", t.getUpdatedAt());
            return item;
        }).collect(Collectors.toList());

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("tickets", tickets);
        resp.put("total", ticketsPage.getTotalElements());
        return resp;
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(@PathVariable("id") Long id, @RequestBody Map<String, Object> body, javax.servlet.http.HttpServletRequest http) {
        Optional<FeedbackTicket> opt = feedbackTicketRepository.findById(id);
        if (!opt.isPresent()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("NOT_FOUND"));

        String status = body == null ? null : (body.get("status") == null ? null : String.valueOf(body.get("status")));
        if (status == null || status.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error("status is required"));
        }

        FeedbackTicket t = opt.get();
        t.setStatus(status.trim());
        feedbackTicketRepository.save(t);

        try {
            String actor = http == null ? null : (String) http.getAttribute("adminActor");
            adminAuditService.record(actor, "feedback_update_status", "feedback_ticket", String.valueOf(t.getId()), "status=" + t.getStatus(), http == null ? null : http.getRemoteAddr());
        } catch (Exception ignored) {
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("id", t.getId());
        resp.put("status", t.getStatus());
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<Map<String, Object>> reply(@PathVariable("id") Long id, @RequestBody Map<String, Object> body, javax.servlet.http.HttpServletRequest http) {
        Optional<FeedbackTicket> opt = feedbackTicketRepository.findById(id);
        if (!opt.isPresent()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error("NOT_FOUND"));

        String reply = body == null ? null : (body.get("reply") == null ? null : String.valueOf(body.get("reply")));
        if (reply == null || reply.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error("reply is required"));
        }

        FeedbackTicket t = opt.get();
        t.setAdminReply(reply.trim());
        t.setAdminRepliedAt(System.currentTimeMillis());
        if (t.getStatus() == null || t.getStatus().trim().isEmpty() || "open".equalsIgnoreCase(t.getStatus())) {
            t.setStatus("processing");
        }
        feedbackTicketRepository.save(t);

        try {
            String actor = http == null ? null : (String) http.getAttribute("adminActor");
            adminAuditService.record(actor, "feedback_reply", "feedback_ticket", String.valueOf(t.getId()), "replied", http == null ? null : http.getRemoteAddr());
        } catch (Exception ignored) {
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("id", t.getId());
        resp.put("status", t.getStatus());
        return ResponseEntity.ok(resp);
    }

    private static Map<String, Object> error(String msg) {
        Map<String, Object> e = new LinkedHashMap<>();
        e.put("message", msg);
        return e;
    }
}
