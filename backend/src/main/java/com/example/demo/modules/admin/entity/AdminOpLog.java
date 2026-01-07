package com.example.demo.modules.admin.entity;

import javax.persistence.*;

@Entity
@Table(name = "admin_op_log")
public class AdminOpLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private long createdAt;

    @Column(nullable = false)
    private String actor;

    @Column(nullable = false)
    private String action;

    private String targetType;

    private String targetId;

    @Lob
    private String detail;

    private String ip;

    @PrePersist
    public void prePersist() {
        if (createdAt == 0L) {
            createdAt = System.currentTimeMillis();
        }
        if (actor == null) actor = "";
        if (action == null) action = "";
    }

    public AdminOpLog() {
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

    public String getActor() {
        return actor;
    }

    public void setActor(String actor) {
        this.actor = actor;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getTargetType() {
        return targetType;
    }

    public void setTargetType(String targetType) {
        this.targetType = targetType;
    }

    public String getTargetId() {
        return targetId;
    }

    public void setTargetId(String targetId) {
        this.targetId = targetId;
    }

    public String getDetail() {
        return detail;
    }

    public void setDetail(String detail) {
        this.detail = detail;
    }

    public String getIp() {
        return ip;
    }

    public void setIp(String ip) {
        this.ip = ip;
    }
}
