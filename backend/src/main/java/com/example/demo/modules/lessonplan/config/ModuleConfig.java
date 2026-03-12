package com.teacherai.config;

import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@ComponentScan(basePackages = {
    "com.teacherai.modules",
    "com.teacherai.common",
    "com.teacherai.service"
})
public class ModuleConfig {
    // 模块配置类，确保所有模块都被扫描到
}