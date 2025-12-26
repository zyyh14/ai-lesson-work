package com.example.demo.controller;

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

    @Value("${ark.baseUrl}")
    private String arkBaseUrl;

    @Value("${ark.apiKey}")
    private String arkApiKey;

    @Value("${ark.defaultModel}")
    private String defaultModel;

    @PostMapping("/chat/completions")
    public ResponseEntity<String> chatCompletions(@RequestBody Map<String, Object> body) {
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
        ResponseEntity<String> resp = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        return ResponseEntity
                .status(resp.getStatusCode())
                .contentType(MediaType.APPLICATION_JSON)
                .body(resp.getBody());
    }

    @PostMapping(value = "/chat/completions/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<StreamingResponseBody> chatCompletionsStream(@RequestBody Map<String, Object> body) {
        Map<String, Object> payload = new LinkedHashMap<>(body);

        Object model = payload.get("model");
        if (model == null || String.valueOf(model).trim().isEmpty()) {
            payload.put("model", defaultModel);
        }
        payload.put("stream", true);

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
                try {
                    in = conn.getInputStream();
                    reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
                    String line;
                    while ((line = reader.readLine()) != null) {
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
}