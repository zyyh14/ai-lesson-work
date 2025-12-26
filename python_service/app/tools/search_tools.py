from typing import List, Dict, Any, Optional
from langchain_core.tools import tool
import json
import requests
from ..core.config import settings

def tavily_search(query: str) -> str:
    """
    使用Tavily API在互联网上搜索教学资源。
    
    Args:
        query: 搜索查询字符串（例如：'李白静夜思教案'）
        
    Returns:
        包含标题、URL、内容摘要的搜索结果的JSON字符串
    """
    if not hasattr(settings, 'TAVILY_API_KEY') or not settings.TAVILY_API_KEY:
        return json.dumps({"error": "Tavily API key not configured"}, ensure_ascii=False)
    
    url = "https://api.tavily.com/search"
    
    payload = {
        "api_key": settings.TAVILY_API_KEY,
        "query": query,
        "search_depth": "basic",
        "include_answer": False,
        "include_raw_content": True,
        "max_results": 5,
        "include_domains": [
            "edu.cn", "jianshu.com", "zhihu.com", "bilibili.com", "xuexi.cn"
        ]
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        results = response.json()
        search_results = results.get("results", [])
        
        # 格式化结果为JSON字符串
        formatted_results = []
        for result in search_results:
            formatted_results.append({
                "title": result.get("title", ""),
                "url": result.get("url", ""),
                "content": result.get("content", "")[:500] if result.get("content") else "",
                "score": result.get("score", 0)
            })
        
        return json.dumps(formatted_results, ensure_ascii=False)
    except Exception as e:
        error_msg = f"Tavily搜索错误: {str(e)}"
        print(error_msg)
        return json.dumps({"error": error_msg}, ensure_ascii=False)


# LangChain Tool 版本（用于 Agent），保留普通函数版本以兼容旧接口
tavily_search_tool = tool(tavily_search)


def duckduckgo_search(query: str) -> str:
    """
    使用DuckDuckGo在互联网上搜索教学资源（备用搜索工具）。
    
    Args:
        query: 搜索查询字符串
        
    Returns:
        包含标题、URL、内容摘要的搜索结果的JSON字符串
    """
    try:
        from duckduckgo_search import DDGS
        
        ddgs = DDGS()
        results = list(ddgs.text(query, max_results=5))
        
        # 格式化结果
        formatted_results = []
        for i, result in enumerate(results):
            formatted_results.append({
                "title": result.get("title", ""),
                "url": result.get("href", ""),
                "content": result.get("body", "")[:500],
                "score": 1.0 - (i * 0.1)
            })
        
        return json.dumps(formatted_results, ensure_ascii=False)
    except Exception as e:
        error_msg = f"DuckDuckGo搜索错误: {str(e)}"
        print(error_msg)
        return json.dumps({"error": error_msg}, ensure_ascii=False)


# LangChain Tool 版本（用于 Agent）
duckduckgo_search_tool = tool(duckduckgo_search)


class SearchTools:
    """搜索工具管理类"""
    
    @classmethod
    def get_search_tools(cls) -> List:
        """获取可用的搜索工具列表"""
        tools = []
        
        # 如果配置了Tavily API，优先使用
        if hasattr(settings, 'TAVILY_API_KEY') and settings.TAVILY_API_KEY:
            tools.append(tavily_search_tool)
        
        # 添加DuckDuckGo作为备用
        tools.append(duckduckgo_search_tool)
        
        return tools
