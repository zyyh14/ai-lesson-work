from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List
from pydantic import BaseModel
import json

router = APIRouter()

class ResourceResponse(BaseModel):
    resources: List[Dict[str, Any]]
    total: int
    page: int
    limit: int

@router.get("/search-simple", response_model=ResourceResponse)
async def search_resources_simple(
    query: str,
    limit: int = Query(10, gt=0, le=100),
    page: int = Query(1, gt=0),
):
    """简化版搜索资源 - 只返回搜索结果，不使用AI整理，但有内容质量过滤"""
    try:
        # 1. 使用Tavily搜索
        from ..tools.search_tools import tavily_search
        
        search_results = tavily_search(query)
        results = json.loads(search_results)
        
        if not isinstance(results, list) or len(results) == 0:
            return {"resources": [], "total": 0, "page": page, "limit": limit}
        
        # 2. 清理和过滤内容
        from ..utils.content_cleaner import clean_web_content, extract_educational_content, is_quality_content
        
        # 3. 构建资源列表
        resources = []
        for i, result in enumerate(results):
            title = result.get('title', '')
            content = result.get('content', '')
            url = result.get('url', '')
            
            # 深度清理内容
            cleaned_content = clean_web_content(content)
            educational_content = extract_educational_content(cleaned_content)
            
            # 只保留有内容的结果（降低要求）
            if len(educational_content) < 20:
                continue
            
            resource = {
                "id": len(resources) + 1,
                "title": title,
                "type": "教学资源",
                "content": educational_content[:600],  # 限制长度
                "source_url": url,
                "tags": query,
                "score": result.get('score', 0),
                "quality": "高质量"
            }
            resources.append(resource)
            
            # 限制返回数量
            if len(resources) >= limit:
                break
        
        # 按质量和分数排序
        resources.sort(key=lambda x: x.get('score', 0), reverse=True)
        
        return {
            "resources": resources,
            "total": len(resources),
            "page": page,
            "limit": limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"搜索失败: {str(e)}")