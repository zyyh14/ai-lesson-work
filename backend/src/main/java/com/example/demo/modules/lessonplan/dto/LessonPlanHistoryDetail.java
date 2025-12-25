package com.example.demo.modules.lessonplan.dto;

public class LessonPlanHistoryDetail {

    private Long id;
    private long createdAt;
    private LessonPlanRequest request;
    private String data;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }

    public LessonPlanRequest getRequest() {
        return request;
    }

    public void setRequest(LessonPlanRequest request) {
        this.request = request;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }
}
