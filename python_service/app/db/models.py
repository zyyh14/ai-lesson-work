"""
数据模型定义（用于Pydantic验证）

注意：本项目使用Supabase作为数据库，这些模型主要用于API请求/响应的数据验证。
实际的数据库操作通过Supabase客户端完成。
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ResourceBase(BaseModel):
    """资源基础模型"""
    title: str = Field(..., description="资源标题", max_length=255)
    type: str = Field(..., description="资源类型", pattern="^(教案|课件|习题|视频)$")
    content: Optional[str] = Field(None, description="资源内容（文本或文件URL）")
    source_url: Optional[str] = Field(None, description="来源链接", max_length=512)
    tags: Optional[str] = Field(None, description="标签，多个用逗号分隔", max_length=255)


class ResourceCreate(ResourceBase):
    """创建资源的请求模型"""
    pass


class ResourceUpdate(BaseModel):
    """更新资源的请求模型"""
    title: Optional[str] = Field(None, max_length=255)
    type: Optional[str] = Field(None, pattern="^(教案|课件|习题|视频)$")
    content: Optional[str] = None
    source_url: Optional[str] = Field(None, max_length=512)
    tags: Optional[str] = Field(None, max_length=255)


class Resource(ResourceBase):
    """资源响应模型"""
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True