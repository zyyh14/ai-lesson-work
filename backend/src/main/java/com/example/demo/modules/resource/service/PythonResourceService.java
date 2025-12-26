package com.example.demo.modules.resource.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.util.HashMap;
import java.util.Map;

@Service
public class PythonResourceService {
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    @Value("${python.service.url:http://localhost:5000}")
    private String pythonServiceUrl;
    
    @Value("${python.service.timeout:30000}")
    private int timeout;
    
    /**
     * 调用 Python 服务搜索教学资源
     */
    public Map<String, Object> searchResources(String query, Integer limit, Integer page) {
        String url = pythonServiceUrl + "/api/v1/resources/search";
        
        // 构建查询参数
        String urlWithParams = url + "?query=" + query + "&limit=" + limit + "&page=" + page;
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                urlWithParams, 
                HttpMethod.GET, 
                entity, 
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            
            return response.getBody() != null ? response.getBody() : new HashMap<>();
        } catch (RestClientException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "调用 Python 服务失败: " + e.getMessage());
            error.put("status", "error");
            return error;
        }
    }
    
    /**
     * 调用 Python 服务生成练习题
     */
    public Map<String, Object> generateExercises(String knowledgePoint) {
        String url = pythonServiceUrl + "/api/v1/exercises/generate";
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("knowledge_point", knowledgePoint);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate.postForEntity(url, entity, Map.class);
            
            return response.getBody() != null ? response.getBody() : new HashMap<>();
        } catch (RestClientException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "调用 Python 服务失败: " + e.getMessage());
            error.put("status", "error");
            return error;
        }
    }
    
    /**
     * 收藏资源
     */
    public Map<String, Object> favoriteResource(Integer resourceId, String notes, Integer userId) {
        String url = pythonServiceUrl + "/api/v1/favorites/resources/favorite?user_id=" + userId;
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("resource_id", resourceId);
            requestBody.put("notes", notes != null ? notes : "");
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate.postForEntity(url, entity, Map.class);
            
            return response.getBody() != null ? response.getBody() : new HashMap<>();
        } catch (RestClientException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "调用 Python 服务失败: " + e.getMessage());
            error.put("status", "error");
            return error;
        }
    }
    
    /**
     * 取消收藏资源
     */
    public Map<String, Object> unfavoriteResource(Integer resourceId, Integer userId) {
        String url = pythonServiceUrl + "/api/v1/favorites/resources/favorite/" + resourceId + "?user_id=" + userId;
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            restTemplate.exchange(url, HttpMethod.DELETE, entity, Void.class);
            
            Map<String, Object> result = new HashMap<>();
            result.put("status", "success");
            result.put("message", "取消收藏成功");
            return result;
        } catch (RestClientException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "调用 Python 服务失败: " + e.getMessage());
            error.put("status", "error");
            return error;
        }
    }
    
    /**
     * 获取收藏的资源列表
     */
    public Map<String, Object> getFavoriteResources(Integer userId, Integer limit, Integer page) {
        String url = pythonServiceUrl + "/api/v1/favorites/resources/favorites?user_id=" + userId + "&limit=" + limit + "&page=" + page;
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            
            return response.getBody() != null ? response.getBody() : new HashMap<>();
        } catch (RestClientException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "调用 Python 服务失败: " + e.getMessage());
            error.put("status", "error");
            return error;
        }
    }
    
    /**
     * 收藏练习题
     */
    public Map<String, Object> favoriteExercise(Integer exerciseId, String notes, Integer userId) {
        String url = pythonServiceUrl + "/api/v1/favorites/exercises/favorite?user_id=" + userId;
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("exercise_id", exerciseId);
            requestBody.put("notes", notes != null ? notes : "");
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate.postForEntity(url, entity, Map.class);
            
            return response.getBody() != null ? response.getBody() : new HashMap<>();
        } catch (RestClientException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "调用 Python 服务失败: " + e.getMessage());
            error.put("status", "error");
            return error;
        }
    }
    
    /**
     * 取消收藏练习题
     */
    public Map<String, Object> unfavoriteExercise(Integer exerciseId, Integer userId) {
        String url = pythonServiceUrl + "/api/v1/favorites/exercises/favorite/" + exerciseId + "?user_id=" + userId;
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            restTemplate.exchange(url, HttpMethod.DELETE, entity, Void.class);
            
            Map<String, Object> result = new HashMap<>();
            result.put("status", "success");
            result.put("message", "取消收藏成功");
            return result;
        } catch (RestClientException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "调用 Python 服务失败: " + e.getMessage());
            error.put("status", "error");
            return error;
        }
    }
    
    /**
     * 获取收藏的练习题列表
     */
    public Map<String, Object> getFavoriteExercises(Integer userId, Integer limit, Integer page) {
        String url = pythonServiceUrl + "/api/v1/favorites/exercises/favorites?user_id=" + userId + "&limit=" + limit + "&page=" + page;
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            @SuppressWarnings("unchecked")
            ResponseEntity<Map<String, Object>> response = (ResponseEntity<Map<String, Object>>) (ResponseEntity<?>) restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            
            return response.getBody() != null ? response.getBody() : new HashMap<>();
        } catch (RestClientException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "调用 Python 服务失败: " + e.getMessage());
            error.put("status", "error");
            return error;
        }
    }
}

