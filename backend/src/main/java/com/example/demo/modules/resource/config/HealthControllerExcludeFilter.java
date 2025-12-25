package com.example.demo.modules.resource.config;

import org.springframework.core.type.classreading.MetadataReader;
import org.springframework.core.type.classreading.MetadataReaderFactory;
import org.springframework.core.type.filter.TypeFilter;

import java.io.IOException;

/**
 * 自定义过滤器，用于排除教案模块的冲突类
 * 解决 Bean 名称冲突问题（HealthController、CorsConfig 等）
 */
public class HealthControllerExcludeFilter implements TypeFilter {
    
    @Override
    public boolean match(MetadataReader metadataReader, MetadataReaderFactory metadataReaderFactory) throws IOException {
        String className = metadataReader.getClassMetadata().getClassName();
        
        // 排除教案模块的冲突类（无论包名是什么）
        // 1. HealthController
        if (className.contains("lessonplan") && 
            className.contains("HealthController") &&
            !className.contains("ppt")) {
            return true;
        }
        
        // 2. CorsConfig
        if (className.contains("lessonplan") && 
            className.contains("CorsConfig") &&
            !className.contains("ppt")) {
            return true;
        }
        
        return false;
    }
}

