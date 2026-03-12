from typing import List, Dict, Any, Optional
from langchain_core.prompts import PromptTemplate
import json
import traceback

from ..core.config import settings

# Agent功能暂时禁用，直接返回空结果
class TeachingResourceAgent:
    """教学资源管理Agent（简化版）"""
    
    def __init__(self):
        pass
    
    async def search_and_manage_resources(
        self,
        keyword: str,
        resource_type: Optional[str] = None,
        limit: int = 5
    ) -> Dict[str, Any]:
        """搜索并管理资源 - 简化版本"""
        return {
            "status": "success",
            "keyword": keyword,
            "saved_count": 0,
            "message": "Agent功能已禁用"
        }

# 创建单例实例 - 延迟初始化
_agent_service_instance = None

def get_agent_service():
    """获取Agent服务单例"""
    global _agent_service_instance
    if _agent_service_instance is None:
        _agent_service_instance = TeachingResourceAgent()
    return _agent_service_instance

# 为了向后兼容，保留这个变量，但使用延迟初始化
class AgentServiceProxy:
    """Agent服务代理，实现延迟初始化"""
    def __getattr__(self, name):
        return getattr(get_agent_service(), name)

agent_service = AgentServiceProxy()
