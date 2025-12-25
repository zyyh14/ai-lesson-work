package com.example.demo.modules.resource.dto;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Min;

public class ResourceSearchRequest {
    @NotBlank(message = "搜索关键词不能为空")
    private String query;
    
    @Min(value = 1, message = "每页数量必须大于0")
    private Integer limit = 10;
    
    @Min(value = 1, message = "页码必须大于0")
    private Integer page = 1;

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public Integer getLimit() {
        return limit;
    }

    public void setLimit(Integer limit) {
        this.limit = limit;
    }

    public Integer getPage() {
        return page;
    }

    public void setPage(Integer page) {
        this.page = page;
    }
}

