package com.example.demo.controller;

import com.example.demo.modules.admin.entity.TeacherUser;
import com.example.demo.modules.admin.repository.TeacherUserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final TeacherUserRepository teacherUserRepository;

    public AuthController(TeacherUserRepository teacherUserRepository) {
        this.teacherUserRepository = teacherUserRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        String username = body == null ? null : String.valueOf(body.get("username"));
        String password = body == null ? null : String.valueOf(body.get("password"));
        if (username == null || username.trim().isEmpty() || password == null || password.trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(msg("username/password required"));
        }
        String u = username.trim();
        if ("admin".equalsIgnoreCase(u)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(msg("admin cannot be registered"));
        }
        Optional<TeacherUser> existing = teacherUserRepository.findByUsername(u);
        if (existing.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(msg("username already exists"));
        }

        TeacherUser user = new TeacherUser();
        user.setUsername(u);
        user.setPassword(password);
        user.setActive(true);
        user.setRole("teacher");
        TeacherUser saved = teacherUserRepository.save(user);

        HttpSession session = request.getSession(true);
        session.setAttribute("uid", saved.getId());
        session.setAttribute("username", saved.getUsername());
        session.setAttribute("role", saved.getRole());

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("id", saved.getId());
        resp.put("username", saved.getUsername());
        resp.put("role", saved.getRole());
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, Object> body, HttpServletRequest request) {
        String username = body == null ? null : String.valueOf(body.get("username"));
        String password = body == null ? null : String.valueOf(body.get("password"));
        if (username == null || username.trim().isEmpty() || password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(msg("username/password required"));
        }

        Optional<TeacherUser> found = teacherUserRepository.findByUsername(username.trim());
        if (!found.isPresent()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(msg("invalid credentials"));
        }
        TeacherUser u = found.get();
        if (!u.isActive()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(msg("user disabled"));
        }
        if (u.getPassword() == null || !u.getPassword().equals(password)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(msg("invalid credentials"));
        }

        HttpSession session = request.getSession(true);
        session.setAttribute("uid", u.getId());
        session.setAttribute("username", u.getUsername());
        session.setAttribute("role", u.getRole() == null ? "teacher" : u.getRole());

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("id", u.getId());
        resp.put("username", u.getUsername());
        resp.put("role", u.getRole() == null ? "teacher" : u.getRole());
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(msg("Unauthorized"));
        }
        Object uid = session.getAttribute("uid");
        Object username = session.getAttribute("username");
        Object role = session.getAttribute("role");
        if (uid == null || username == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(msg("Unauthorized"));
        }
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("id", uid);
        resp.put("username", username);
        resp.put("role", role == null ? "teacher" : role);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return ResponseEntity.ok().build();
    }

    private static Map<String, Object> msg(String m) {
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("message", m);
        return resp;
    }
}
