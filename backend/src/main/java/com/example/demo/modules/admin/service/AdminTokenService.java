package com.example.demo.modules.admin.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AdminTokenService {
    private static final long DEFAULT_EXPIRE_MS = 24L * 60L * 60L * 1000L;

    private final SecureRandom random = new SecureRandom();
    private final Map<String, Long> tokenExpireAt = new ConcurrentHashMap<>();
    private final Map<String, String> tokenActor = new ConcurrentHashMap<>();

    public String issueToken(String actor) {
        String token = generateToken();
        long expireAt = System.currentTimeMillis() + DEFAULT_EXPIRE_MS;
        tokenExpireAt.put(token, expireAt);
        tokenActor.put(token, actor == null ? "" : actor);
        return token;
    }

    public String getActor(String token) {
        if (token == null || token.trim().isEmpty()) return null;
        if (!isValid(token)) return null;
        return tokenActor.get(token);
    }

    public boolean isValid(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }
        Long exp = tokenExpireAt.get(token);
        if (exp == null) {
            return false;
        }
        if (exp < System.currentTimeMillis()) {
            tokenExpireAt.remove(token);
            tokenActor.remove(token);
            return false;
        }
        return true;
    }

    private String generateToken() {
        byte[] buf = new byte[32];
        random.nextBytes(buf);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(buf);
    }
}
