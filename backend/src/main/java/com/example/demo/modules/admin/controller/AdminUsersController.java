package com.example.demo.modules.admin.controller;

import com.example.demo.modules.admin.dto.AdminCreateUserRequest;
import com.example.demo.modules.admin.dto.AdminUpdateUserRequest;
import com.example.demo.modules.admin.entity.TeacherUser;
import com.example.demo.modules.admin.repository.TeacherUserRepository;
import com.example.demo.modules.admin.service.AdminAuditService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUsersController {

    private final TeacherUserRepository teacherUserRepository;
    private final AdminAuditService adminAuditService;

    public AdminUsersController(TeacherUserRepository teacherUserRepository, AdminAuditService adminAuditService) {
        this.teacherUserRepository = teacherUserRepository;
        this.adminAuditService = adminAuditService;
    }

    @GetMapping
    public Map<String, Object> listUsers(
            @RequestParam(value = "page", required = false, defaultValue = "1") int page,
            @RequestParam(value = "limit", required = false, defaultValue = "20") int limit,
            @RequestParam(value = "status", required = false) String status
    ) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(100, Math.max(1, limit));
        PageRequest pageable = PageRequest.of(safePage - 1, safeLimit, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<TeacherUser> result;
        if (status != null && !status.trim().isEmpty()) {
            boolean active = !"disabled".equalsIgnoreCase(status) && !"inactive".equalsIgnoreCase(status);
            result = teacherUserRepository.findAllByActive(active, pageable);
        } else {
            result = teacherUserRepository.findAll(pageable);
        }

        List<Map<String, Object>> users = result.getContent().stream().map(u -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", u.getId());
            item.put("username", u.getUsername());
            item.put("active", u.isActive());
            item.put("status", u.isActive() ? "active" : "disabled");
            item.put("createdAt", u.getCreatedAt());
            item.put("updatedAt", u.getUpdatedAt());
            return item;
        }).collect(Collectors.toList());

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("users", users);
        resp.put("total", result.getTotalElements());
        resp.put("page", safePage);
        resp.put("limit", safeLimit);
        return resp;
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody AdminCreateUserRequest request, javax.servlet.http.HttpServletRequest http) {
        if (request == null || request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("message", "username required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(resp);
        }

        String username = request.getUsername().trim();
        String password = request.getPassword() == null ? "123456" : request.getPassword();

        Optional<TeacherUser> existing = teacherUserRepository.findByUsername(username);
        if (existing.isPresent()) {
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("message", "username already exists");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(resp);
        }

        TeacherUser user = new TeacherUser();
        user.setUsername(username);
        user.setPassword(password);
        user.setActive(true);

        TeacherUser saved = teacherUserRepository.save(user);

        try {
            String actor = http == null ? null : (String) http.getAttribute("adminActor");
            adminAuditService.record(actor, "teacher_user_create", "teacher_user", String.valueOf(saved.getId()), "username=" + saved.getUsername(), http == null ? null : http.getRemoteAddr());
        } catch (Exception ignored) {
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("id", saved.getId());
        resp.put("username", saved.getUsername());
        resp.put("active", saved.isActive());
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable("id") Long id, @RequestBody AdminUpdateUserRequest request, javax.servlet.http.HttpServletRequest http) {
        if (id == null) {
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("message", "id required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(resp);
        }

        Optional<TeacherUser> opt = teacherUserRepository.findById(id);
        if (!opt.isPresent()) {
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("message", "user not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(resp);
        }

        TeacherUser user = opt.get();
        if (request != null && request.getActive() != null) {
            user.setActive(request.getActive());
        }
        teacherUserRepository.save(user);

        try {
            String actor = http == null ? null : (String) http.getAttribute("adminActor");
            adminAuditService.record(actor, "teacher_user_update", "teacher_user", String.valueOf(user.getId()), "active=" + user.isActive(), http == null ? null : http.getRemoteAddr());
        } catch (Exception ignored) {
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("id", user.getId());
        resp.put("username", user.getUsername());
        resp.put("active", user.isActive());
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/{id}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable("id") Long id, javax.servlet.http.HttpServletRequest http) {
        Optional<TeacherUser> opt = teacherUserRepository.findById(id);
        if (!opt.isPresent()) {
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("message", "user not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(resp);
        }

        TeacherUser user = opt.get();
        String tempPassword = "123456";
        user.setPassword(tempPassword);
        teacherUserRepository.save(user);

        try {
            String actor = http == null ? null : (String) http.getAttribute("adminActor");
            adminAuditService.record(actor, "teacher_user_reset_password", "teacher_user", String.valueOf(user.getId()), "username=" + user.getUsername(), http == null ? null : http.getRemoteAddr());
        } catch (Exception ignored) {
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("id", user.getId());
        resp.put("username", user.getUsername());
        resp.put("tempPassword", tempPassword);
        return ResponseEntity.ok(resp);
    }
}
