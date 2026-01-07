package com.example.demo.modules.admin.config;

import com.example.demo.modules.admin.service.AdminTokenService;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;

@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

    private final AdminTokenService adminTokenService;

    public AdminAuthInterceptor(AdminTokenService adminTokenService) {
        this.adminTokenService = adminTokenService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String path = request.getRequestURI();
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        if (path != null && path.startsWith("/api/admin/auth/login")) {
            return true;
        }

        try {
            javax.servlet.http.HttpSession session = request.getSession(false);
            if (session != null) {
                Object role = session.getAttribute("role");
                if (role != null && "admin".equalsIgnoreCase(String.valueOf(role))) {
                    Object username = session.getAttribute("username");
                    if (username != null) {
                        request.setAttribute("adminActor", String.valueOf(username));
                    }
                    return true;
                }
            }
        } catch (Exception ignored) {
        }

        String auth = request.getHeader("Authorization");
        String token = null;
        if (auth != null && auth.startsWith("Bearer ")) {
            token = auth.substring("Bearer ".length()).trim();
        }

        if (!adminTokenService.isValid(token)) {
            response.setStatus(401);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"message\":\"Unauthorized\"}");
            return false;
        }

        try {
            String actor = adminTokenService.getActor(token);
            request.setAttribute("adminActor", actor);
        } catch (Exception ignored) {
        }

        return true;
    }
}
