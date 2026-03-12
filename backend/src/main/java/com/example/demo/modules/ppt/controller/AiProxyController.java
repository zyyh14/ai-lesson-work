package com.example.demo.controller;

import com.example.demo.modules.admin.service.LlmUsageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiProxyController {

    private final RestTemplate restTemplate = new RestTemplate();

    private final LlmUsageService llmUsageService;

    public AiProxyController(LlmUsageService llmUsageService) {
        this.llmUsageService = llmUsageService;
    }

    @Value("${ark.baseUrl}")
    private String arkBaseUrl;

    @Value("${ark.apiKey}")
    private String arkApiKey;

    @Value("${ark.defaultModel}")
    private String defaultModel;

    @PostMapping("/chat/completions")
    public ResponseEntity<String> chatCompletions(@RequestBody Map<String, Object> body) {
        long start = System.currentTimeMillis();
        Map<String, Object> payload = new LinkedHashMap<>(body);

        Object model = payload.get("model");
        if (model == null || String.valueOf(model).trim().isEmpty()) {
            payload.put("model", defaultModel);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(arkApiKey);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(payload, headers);

        String url = arkBaseUrl.replaceAll("/+$", "") + "/chat/completions";
        try {
            ResponseEntity<String> resp = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            Long promptTokens = null;
            Long completionTokens = null;
            Long totalTokens = null;
            try {
                String respBody = resp.getBody();
                if (respBody != null && !respBody.trim().isEmpty()) {
                    com.fasterxml.jackson.databind.JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(respBody);
                    com.fasterxml.jackson.databind.JsonNode usage = root.get("usage");
                    if (usage != null && usage.isObject()) {
                        promptTokens = getLong(usage, "prompt_tokens");
                        completionTokens = getLong(usage, "completion_tokens");
                        totalTokens = getLong(usage, "total_tokens");
                    }
                }
            } catch (Exception ignored) {
            }

            llmUsageService.recordSuccess(
                    "/api/ai/chat/completions",
                    String.valueOf(payload.get("model")),
                    promptTokens,
                    completionTokens,
                    totalTokens,
                    System.currentTimeMillis() - start
            );

            return ResponseEntity
                    .status(resp.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(resp.getBody());
        } catch (Exception e) {
            llmUsageService.recordFailure(
                    "/api/ai/chat/completions",
                    String.valueOf(payload.get("model")),
                    e.getMessage(),
                    System.currentTimeMillis() - start
            );
            throw e;
        }
    }

    @PostMapping(value = "/chat/completions/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<StreamingResponseBody> chatCompletionsStream(@RequestBody Map<String, Object> body) {
        long start = System.currentTimeMillis();
        Map<String, Object> payload = new LinkedHashMap<>(body);

        Object model = payload.get("model");
        if (model == null || String.valueOf(model).trim().isEmpty()) {
            payload.put("model", defaultModel);
        }
        payload.put("stream", true);
        try {
            Map<String, Object> opts = new LinkedHashMap<>();
            opts.put("include_usage", true);
            payload.put("stream_options", opts);
        } catch (Exception ignored) {
        }

        String url = arkBaseUrl.replaceAll("/+$", "") + "/chat/completions";

        try {
            HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(0);
            conn.setRequestProperty("Authorization", "Bearer " + arkApiKey);
            conn.setRequestProperty("Content-Type", "application/json");

            byte[] jsonBytes = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsBytes(payload);
            conn.getOutputStream().write(jsonBytes);
            conn.getOutputStream().flush();

            int code = conn.getResponseCode();
            if (code < 200 || code >= 300) {
                InputStream err = conn.getErrorStream();
                String errText = err == null ? ("HTTP Error: " + code) : readAll(err);
                StreamingResponseBody errorBody = out -> out.write(errText.getBytes(StandardCharsets.UTF_8));
                return ResponseEntity.status(code).contentType(MediaType.APPLICATION_JSON).body(errorBody);
            }

            StreamingResponseBody stream = outputStream -> {
                InputStream in = null;
                BufferedReader reader = null;
                Long promptTokens = null;
                Long completionTokens = null;
                Long totalTokens = null;
                try {
                    in = conn.getInputStream();
                    reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
                    String line;
                    while ((line = reader.readLine()) != null) {
                        // Try best-effort parse usage from SSE data chunks (if provider includes it)
                        try {
                            String trimmed = line == null ? "" : line.trim();
                            if (trimmed.startsWith("data:")) {
                                String data = trimmed.substring("data:".length()).trim();
                                if (!data.isEmpty() && !"[DONE]".equals(data)) {
                                    com.fasterxml.jackson.databind.JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(data);
                                    com.fasterxml.jackson.databind.JsonNode usage = root.get("usage");
                                    if (usage != null && usage.isObject()) {
                                        Long pt = getLong(usage, "prompt_tokens");
                                        Long ct = getLong(usage, "completion_tokens");
                                        Long tt = getLong(usage, "total_tokens");
                                        if (pt != null) promptTokens = pt;
                                        if (ct != null) completionTokens = ct;
                                        if (tt != null) totalTokens = tt;
                                    }
                                }
                            }
                        } catch (Exception ignored) {
                        }
                        outputStream.write((line + "\n").getBytes(StandardCharsets.UTF_8));
                        outputStream.flush();
                    }
                } finally {
                    try {
                        if (reader != null) reader.close();
                    } catch (Exception ignored) {
                    }
                    try {
                        if (in != null) in.close();
                    } catch (Exception ignored) {
                    }
                    try {
                        conn.disconnect();
                    } catch (Exception ignored) {
                    }

                    try {
                        llmUsageService.recordSuccess(
                                "/api/ai/chat/completions/stream",
                                String.valueOf(payload.get("model")),
                                promptTokens,
                                completionTokens,
                                totalTokens,
                                System.currentTimeMillis() - start
                        );
                    } catch (Exception ignored) {
                    }
                }
            };

            HttpHeaders headers = new HttpHeaders();
            headers.setCacheControl(CacheControl.noCache());
            headers.set("X-Accel-Buffering", "no");
            headers.setContentType(MediaType.TEXT_EVENT_STREAM);
            return new ResponseEntity<>(stream, headers, HttpStatus.OK);
        } catch (Exception e) {
            StreamingResponseBody errorBody = out -> out.write(("Stream proxy error: " + e.getMessage()).getBytes(StandardCharsets.UTF_8));
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).contentType(MediaType.TEXT_PLAIN).body(errorBody);
        }
    }

    private static String readAll(InputStream in) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line).append('\n');
        }
        return sb.toString();
    }

    private static Long getLong(com.fasterxml.jackson.databind.JsonNode node, String field) {
        try {
            com.fasterxml.jackson.databind.JsonNode v = node.get(field);
            if (v == null || v.isNull()) return null;
            if (v.isNumber()) return v.longValue();
            String s = v.asText();
            if (s == null || s.trim().isEmpty()) return null;
            return Long.parseLong(s.trim());
        } catch (Exception e) {
            return null;
        }
    }
}