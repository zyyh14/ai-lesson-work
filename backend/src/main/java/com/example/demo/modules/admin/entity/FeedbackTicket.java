package com.example.demo.modules.admin.entity;

import javax.persistence.*;

@Entity
@Table(name = "feedback_ticket")
public class FeedbackTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String status;

    @Lob
    @Column(nullable = false)
    private String content;

    @Lob
    private String adminReply;

    private Long adminRepliedAt;

    @Column(nullable = false)
    private long createdAt;

    @Column(nullable = false)
    private long updatedAt;

    @PrePersist
    public void prePersist() {
        long now = System.currentTimeMillis();
        if (createdAt == 0L) createdAt = now;
        if (updatedAt == 0L) updatedAt = now;
        if (status == null || status.trim().isEmpty()) status = "open";
        if (username == null) username = "unknown";
        if (name == null) name = "";
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = System.currentTimeMillis();
    }

    public FeedbackTicket() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getAdminReply() {
        return adminReply;
    }

    public void setAdminReply(String adminReply) {
        this.adminReply = adminReply;
    }

    public Long getAdminRepliedAt() {
        return adminRepliedAt;
    }

    public void setAdminRepliedAt(Long adminRepliedAt) {
        this.adminRepliedAt = adminRepliedAt;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }

    public long getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(long updatedAt) {
        this.updatedAt = updatedAt;
    }
}
