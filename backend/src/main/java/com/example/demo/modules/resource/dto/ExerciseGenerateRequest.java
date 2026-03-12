package com.example.demo.modules.resource.dto;

import javax.validation.constraints.NotBlank;

public class ExerciseGenerateRequest {
    @NotBlank(message = "知识点不能为空")
    private String knowledge_point;

    public String getKnowledge_point() {
        return knowledge_point;
    }

    public void setKnowledge_point(String knowledge_point) {
        this.knowledge_point = knowledge_point;
    }
}

