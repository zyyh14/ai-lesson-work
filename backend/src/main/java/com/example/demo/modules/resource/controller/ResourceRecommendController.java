package com.example.demo.modules.resource.controller;

import com.example.demo.modules.resource.dto.ExerciseGenerateRequest;
import com.example.demo.modules.resource.dto.FavoriteRequest;
import com.example.demo.modules.resource.service.PythonResourceService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import javax.validation.constraints.Min;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/resource")
@Validated
public class ResourceRecommendController {
    
    private final PythonResourceService pythonResourceService;
    
    public ResourceRecommendController(PythonResourceService pythonResourceService) {
        this.pythonResourceService = pythonResourceService;
    }
    
    /**
     * 搜索教学资源
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchResources(
            @RequestParam String query,
            @RequestParam(defaultValue = "10") @Min(1) Integer limit,
            @RequestParam(defaultValue = "1") @Min(1) Integer page
    ) {
        Map<String, Object> result = pythonResourceService.searchResources(query, limit, page);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 生成练习题
     */
    @PostMapping("/exercises/generate")
    public ResponseEntity<Map<String, Object>> generateExercises(
            @Valid @RequestBody ExerciseGenerateRequest request
    ) {
        Map<String, Object> result = pythonResourceService.generateExercises(request.getKnowledge_point());
        return ResponseEntity.ok(result);
    }
    
    /**
     * 收藏资源
     */
    @PostMapping("/favorites/resources")
    public ResponseEntity<Map<String, Object>> favoriteResource(
            @Valid @RequestBody FavoriteRequest request,
            @RequestParam(defaultValue = "1") Integer user_id
    ) {
        Map<String, Object> result = pythonResourceService.favoriteResource(
            request.getResource_id(), 
            request.getNotes(), 
            user_id
        );
        return ResponseEntity.ok(result);
    }
    
    /**
     * 取消收藏资源
     */
    @DeleteMapping("/favorites/resources/{resource_id}")
    public ResponseEntity<Map<String, Object>> unfavoriteResource(
            @PathVariable("resource_id") Integer resource_id,
            @RequestParam(defaultValue = "1") Integer user_id
    ) {
        Map<String, Object> result = pythonResourceService.unfavoriteResource(resource_id, user_id);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 获取收藏的资源列表
     */
    @GetMapping("/favorites/resources")
    public ResponseEntity<Map<String, Object>> getFavoriteResources(
            @RequestParam(defaultValue = "1") Integer user_id,
            @RequestParam(defaultValue = "20") @Min(1) Integer limit,
            @RequestParam(defaultValue = "1") @Min(1) Integer page
    ) {
        Map<String, Object> result = pythonResourceService.getFavoriteResources(user_id, limit, page);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 收藏练习题
     */
    @PostMapping("/favorites/exercises")
    public ResponseEntity<Map<String, Object>> favoriteExercise(
            @Valid @RequestBody Map<String, Object> request,
            @RequestParam(defaultValue = "1") Integer user_id
    ) {
        Integer exerciseId = (Integer) request.get("exercise_id");
        String notes = request.get("notes") != null ? (String) request.get("notes") : "";
        
        Map<String, Object> result = pythonResourceService.favoriteExercise(exerciseId, notes, user_id);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 取消收藏练习题
     */
    @DeleteMapping("/favorites/exercises/{exercise_id}")
    public ResponseEntity<Map<String, Object>> unfavoriteExercise(
            @PathVariable("exercise_id") Integer exercise_id,
            @RequestParam(defaultValue = "1") Integer user_id
    ) {
        Map<String, Object> result = pythonResourceService.unfavoriteExercise(exercise_id, user_id);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 获取收藏的练习题列表
     */
    @GetMapping("/favorites/exercises")
    public ResponseEntity<Map<String, Object>> getFavoriteExercises(
            @RequestParam(defaultValue = "1") Integer user_id,
            @RequestParam(defaultValue = "20") @Min(1) Integer limit,
            @RequestParam(defaultValue = "1") @Min(1) Integer page
    ) {
        Map<String, Object> result = pythonResourceService.getFavoriteExercises(user_id, limit, page);
        return ResponseEntity.ok(result);
    }
    
    /**
     * 健康检查
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> result = new HashMap<>();
        result.put("status", "ok");
        result.put("service", "resource-recommendation");
        return ResponseEntity.ok(result);
    }
}

