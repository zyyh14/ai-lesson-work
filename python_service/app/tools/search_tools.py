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
    
    # 优化搜索参数，专注教育内容
    payload = {
        "api_key": settings.TAVILY_API_KEY,
        "query": f"{query} 教学 教案 课程",  # 添加教育相关关键词
        "search_depth": "basic",
        "include_answer": False,
        "include_raw_content": True,
        "max_results": 8,  # 增加结果数量以便筛选
        "include_domains": [
            "edu.cn", "jianshu.com", "zhihu.com", "bilibili.com", 
            "xuexi.cn", "baidu.com", "sohu.com", "163.com",
            "teachermate.cn", "zxxk.com"  # 添加更多教育网站
        ],
        "exclude_domains": [
            "github.com", "stackoverflow.com", "csdn.net"  # 排除技术网站
        ]
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        results = response.json()
        search_results = results.get("results", [])
        
        # 格式化结果为JSON字符串，并过滤低质量内容
        formatted_results = []
        for result in search_results:
            content = result.get("content", "")
            title = result.get("title", "")
            
            # 过滤掉明显的技术内容
            if any(tech_word in content.lower() for tech_word in [
                "javascript", "css", "html", "function", "var ", "const ", 
                "import ", "export ", "class ", "div>", "<script", "github"
            ]):
                continue
                
            # 过滤掉明显的技术标题
            if any(tech_word in title.lower() for tech_word in [
                "github", "api", "javascript", "css", "html", "代码"
            ]):
                continue
            
            formatted_results.append({
                "title": title,
                "url": result.get("url", ""),
                "content": content[:800] if content else "",  # 增加内容长度
                "score": result.get("score", 0)
            })
        
        # 按分数排序，取前5个
        formatted_results.sort(key=lambda x: x.get("score", 0), reverse=True)
        return json.dumps(formatted_results[:5], ensure_ascii=False)
        
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
