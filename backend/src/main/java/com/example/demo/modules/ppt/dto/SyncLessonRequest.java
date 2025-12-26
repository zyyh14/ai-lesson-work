package com.example.demo.dto;

public class SyncLessonRequest {
    private String slidesData;
    private String markdownContent;
    private Long version;

    public SyncLessonRequest() {}

    public String getSlidesData() { return slidesData; }
    public void setSlidesData(String slidesData) { this.slidesData = slidesData; }

    public String getMarkdownContent() { return markdownContent; }
    public void setMarkdownContent(String markdownContent) { this.markdownContent = markdownContent; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
}