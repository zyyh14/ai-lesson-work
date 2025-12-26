package com.example.demo.model;

import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.Lob;
import javax.persistence.Table;

@Entity
@Table(name = "t_lesson")
public class Lesson {

    @Id
    private Long id;

    private String title;

    private Long lastModified;

    @Lob
    private String slidesData;

    @Lob
    private String markdownContent;

    private Long version;

    public Lesson() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public Long getLastModified() { return lastModified; }
    public void setLastModified(Long lastModified) { this.lastModified = lastModified; }

    public String getSlidesData() { return slidesData; }
    public void setSlidesData(String slidesData) { this.slidesData = slidesData; }

    public String getMarkdownContent() { return markdownContent; }
    public void setMarkdownContent(String markdownContent) { this.markdownContent = markdownContent; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
}