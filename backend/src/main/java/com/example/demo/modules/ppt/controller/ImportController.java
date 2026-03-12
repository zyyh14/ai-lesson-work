package com.example.demo.controller;

import com.example.demo.service.AdvancedPptImportService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/import")
public class ImportController {

    private final AdvancedPptImportService advancedPptImportService;

    public ImportController(AdvancedPptImportService advancedPptImportService) {
        this.advancedPptImportService = advancedPptImportService;
    }

    @PostMapping(value = "/pptx", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> importPptx(@RequestParam("file") MultipartFile file) {
        try {
            String markdown = advancedPptImportService.convertPptToMarkdown(file.getInputStream());
            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("markdown", markdown);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            // !!! 关键：在控制台打印错误堆栈，方便你看是哪行代码报的错 !!!
            e.printStackTrace();
            
            Map<String, Object> resp = new LinkedHashMap<>();
            // 返回具体错误类型，方便前端判断
            resp.put("message", "解析失败: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }
}
