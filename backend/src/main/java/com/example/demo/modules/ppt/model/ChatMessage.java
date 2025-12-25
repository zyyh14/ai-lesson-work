package com.example.demo.model;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Lob;
import javax.persistence.Table;

@Entity
@Table(name = "t_chat_message")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long lessonId;

    private String sender;

    @Lob // rely on dialect; in H2 MySQL mode this will map to LONGTEXT/TEXT
    private String content;

    private Boolean isToolOutput;

    private Long timestamp;

    public ChatMessage() {}

    public Long getId() { return id; }

    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Boolean getIsToolOutput() { return isToolOutput; }
    public void setIsToolOutput(Boolean toolOutput) { isToolOutput = toolOutput; }

    public Long getTimestamp() { return timestamp; }
    public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }
}