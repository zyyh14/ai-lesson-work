package com.example.demo.modules.lessonplan.dto;

public class LessonPlanHistoryItem {

    private Long id;
    private long createdAt;
    private String subject;
    private String gradeLevel;
    private String topic;
    private boolean hasTemplate;

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

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getGradeLevel() {
        return gradeLevel;
    }

    public void setGradeLevel(String gradeLevel) {
        this.gradeLevel = gradeLevel;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public boolean isHasTemplate() {
        return hasTemplate;
    }

    public void setHasTemplate(boolean hasTemplate) {
        this.hasTemplate = hasTemplate;
    }
}
