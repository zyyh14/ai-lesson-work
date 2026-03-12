package com.example.demo.modules.admin.controller;

import com.example.demo.modules.admin.dto.AdminLoginRequest;
import com.example.demo.modules.admin.dto.AdminLoginResponse;
import com.example.demo.modules.admin.service.AdminAuditService;
import com.example.demo.modules.admin.service.AdminTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

    private final AdminTokenService adminTokenService;
    private final AdminAuditService adminAuditService;

    @Value("${admin.username:admin}")
    private String adminUsername;

    @Value("${admin.password:admin123}")
    private String adminPassword;

    public AdminAuthController(AdminTokenService adminTokenService, AdminAuditService adminAuditService) {
        this.adminTokenService = adminTokenService;
        this.adminAuditService = adminAuditService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AdminLoginRequest request, javax.servlet.http.HttpServletRequest http) {
        String username = request == null ? null : request.getUsername();
        String password = request == null ? null : request.getPassword();

        if (username == null || password == null) {
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("message", "username/password required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(resp);
        }

        if (!adminUsername.equals(username) || !adminPassword.equals(password)) {
            try {
                adminAuditService.record(username, "admin_login_failed", null, null, "invalid credentials", http == null ? null : http.getRemoteAddr());
            } catch (Exception ignored) {
            }
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("message", "invalid credentials");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(resp);
        }

        String token = adminTokenService.issueToken(username);
        try {
            adminAuditService.record(username, "admin_login", null, null, "login success", http == null ? null : http.getRemoteAddr());
        } catch (Exception ignored) {
        }
        return ResponseEntity.ok(new AdminLoginResponse(token));
    }
}
