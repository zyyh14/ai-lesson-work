package com.example.demo.dto;

public class FrontendMessage {
    private String id;
    private String text;
    private String sender;
    private Long timestamp;
    private Boolean isToolOutput;

    public FrontendMessage() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }

    public Long getTimestamp() { return timestamp; }
    public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }

    public Boolean getIsToolOutput() { return isToolOutput; }
    public void setIsToolOutput(Boolean toolOutput) { isToolOutput = toolOutput; }
}