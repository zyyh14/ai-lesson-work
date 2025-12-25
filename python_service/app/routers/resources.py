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
        
        # 2. 爬取网页内容
        import httpx
        crawled_data = []
        
        for result in results[:limit]:
            url = result.get('url', '')
            title = result.get('title', '')
            snippet = result.get('content', '')
            
            # 尝试爬取网页
            page_content = snippet
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(url, follow_redirects=True)
                    if response.status_code == 200:
                        # 简单提取文本（去除HTML标签）
                        import re
                        text = re.sub(r'<[^>]+>', '', response.text)
                        text = re.sub(r'\s+', ' ', text).strip()
                        page_content = text[:2000]  # 限制长度
            except:
                pass
            
            crawled_data.append({
                "title": title,
                "url": url,
                "content": page_content
            })
        
        # 3. 使用AI整理所有结果成一个完整报告
        llm = ChatZhipuAI(
            model="glm-4",
            api_key=settings.ZHIPU_API_KEY,
            temperature=0.3
        )
        
        # 构建整理prompt
        sources_text = "\n\n".join([
            f"来源{i+1}: {item['title']}\n网址: {item['url']}\n内容: {item['content'][:500]}"
            for i, item in enumerate(crawled_data)
        ])
        
        prompt = f"""你是一位专业的教学资源整理专家。请根据以下搜索到的资源，为教师整理一份关于"{query}"的完整教学资源报告。

搜索到的资源：
{sources_text}

请按以下格式整理：

# {query} - 教学资源整理报告

## 一、资源概述
[总结这些资源的主要内容和价值]

## 二、核心知识点
[提取关键的教学知识点]

## 三、教学建议
[给出具体的教学建议和方法]

## 四、参考资源
[列出所有来源网址]

请确保内容专业、实用，适合教师直接使用。"""
        
        ai_response = llm.invoke(prompt)
        organized_report = ai_response.content if hasattr(ai_response, 'content') else str(ai_response)
        
        # 4. 保存整理后的报告到数据库
        resource_data = {
            "title": f"{query} - 教学资源整理报告",
            "type": "教案",
            "content": organized_report,
            "source_url": ", ".join([item['url'] for item in crawled_data[:3]]),
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





