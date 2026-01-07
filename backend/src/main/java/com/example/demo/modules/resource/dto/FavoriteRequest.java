package com.example.demo.modules.resource.dto;

import javax.validation.constraints.NotNull;

public class FavoriteRequest {
    @NotNull(message = "ID不能为空")
    private Integer resource_id;
    
    private String notes = "";

    public Integer getResource_id() {
        return resource_id;
    }

    public void setResource_id(Integer resource_id) {
        this.resource_id = resource_id;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}

