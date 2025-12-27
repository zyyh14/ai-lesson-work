from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List
from pydantic import BaseModel
from ..db.database import db_manager
from ..services.agent_service import agent_service

router = APIRouter()

class ResourceResponse(BaseModel):
    resources: List[Dict[str, Any]]
    total: int
    page: int
    limit: int

@router.get("/search", response_model=ResourceResponse)
async def search_resources(
    query: str,
    limit: int = Query(10, gt=0, le=100),
    page: int = Query(1, gt=0),
):
    try:
        # 1. 使用Tavily搜索
        from ..tools.search_tools import tavily_search
        import json
        from langchain_community.chat_models import ChatZhipuAI
        from ..core.config import settings
        
        search_results = tavily_search(query)
        results = json.loads(search_results)
        
        if not isinstance(results, list) or len(results) == 0:
            return {"resources": [], "total": 0, "page": page, "limit": limit}
        
        # 2. 清理和处理搜索结果
        from ..utils.content_cleaner import clean_web_content, extract_educational_content, is_quality_content
        
        processed_results = []
        for result in results:
            title = result.get('title', '')
            content = result.get('content', '')
            url = result.get('url', '')
            
            # 深度清理内容
            cleaned_content = clean_web_content(content)
            
            # 提取教育相关内容
            educational_content = extract_educational_content(cleaned_content)
            
            # 只保留高质量内容
            if is_quality_content(educational_content) and len(educational_content) > 50:
                processed_results.append({
                    "title": title,
                    "url": url,
                    "content": educational_content[:500]  # 限制长度
                })
        
        if not processed_results:
            return {"resources": [], "total": 0, "page": page, "limit": limit}
        
        # 3. 构建简化的教学资源报告（不使用AI）
        resource_content = f"""# {query} - 教学资源整理

## 相关教学资源

"""
        
        for i, item in enumerate(processed_results[:3], 1):
            resource_content += f"""### 资源{i}: {item['title']}

**内容摘要**: {item['content']}

**资源链接**: {item['url']}

---

"""
        
        resource_content += f"""
## 教学建议

基于以上搜索到的资源，建议教师：

1. **多角度教学**: 结合不同资源的观点和方法，丰富教学内容
2. **实践应用**: 将理论知识与实际案例相结合
3. **互动教学**: 鼓励学生参与讨论和思考
4. **资源整合**: 充分利用各类教学资源，提升教学效果

## 参考资源

{chr(10).join([f"- {item['title']}: {item['url']}" for item in processed_results[:5]])}
"""
        
        # 4. 保存整理后的报告到数据库
        resource_data = {
            "title": f"{query} - 教学资源整理报告",
            "type": "教案",
            "content": resource_content,
            "source_url": ", ".join([item['url'] for item in processed_results[:3]]),
            "tags": query
        }
        
        saved_resource = await db_manager.create_resource(resource_data)
        
        # 5. 返回结果
        return {
            "resources": [saved_resource] if saved_resource else [],
            "total": 1,
            "page": page,
            "limit": limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))





