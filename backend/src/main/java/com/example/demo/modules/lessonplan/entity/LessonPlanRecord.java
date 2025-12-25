package com.example.demo.modules.lessonplan.entity;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Lob;
import javax.persistence.PrePersist;
import javax.persistence.Table;

@Entity
@Table(name = "lesson_plan_record")
public class LessonPlanRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private long createdAt;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private String gradeLevel;

    @Column(nullable = false)
    private String topic;

    private String duration;

    @Lob
    private String objectives;

    @Lob
    private String additionalNotes;

    @Column(nullable = false)
    private boolean hasTemplate;

    @Lob
    @Column(nullable = false)
    private String contentHtml;

    @PrePersist
    public void prePersist() {
        if (createdAt == 0L) {
            createdAt = System.currentTimeMillis();
        }
    }

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

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public String getObjectives() {
        return objectives;
    }

    public void setObjectives(String objectives) {
        this.objectives = objectives;
    }

    public String getAdditionalNotes() {
        return additionalNotes;
    }

    public void setAdditionalNotes(String additionalNotes) {
        this.additionalNotes = additionalNotes;
    }

    public boolean isHasTemplate() {
        return hasTemplate;
    }

    public void setHasTemplate(boolean hasTemplate) {
        this.hasTemplate = hasTemplate;
    }

    public String getContentHtml() {
        return contentHtml;
    }

    public void setContentHtml(String contentHtml) {
        this.contentHtml = contentHtml;
    }
}
