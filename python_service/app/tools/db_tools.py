from typing import List, Dict, Any, Optional, Union
from langchain_core.tools import tool
from ..db.database import db_manager
import json
import asyncio

@tool
def search_resources_in_db(query: str, limit: int = 5) -> str:
    """
    在数据库中搜索教学资源。这是Agent使用的工具，用于检查数据库中是否有相关资源。
    
    Args:
        query: 搜索关键词（例如："李白静夜思"）
        limit: 返回结果的最大数量（默认：5）
        
    Returns:
        匹配的资源列表的JSON字符串，如果没有找到资源则返回空列表
    """
    try:
        # 构建搜索条件
        params = {
            'or': f'(title.ilike.*{query}*,content.ilike.*{query}*,tags.ilike.*{query}*)',
            'order': 'created_at.desc',
            'limit': limit
        }
        
        # 执行搜索（同步方式）
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(db_manager._make_request('GET', 'resources', params=params))
        loop.close()
        
        # 确保返回的是列表
        if not isinstance(result, list):
            result = []
            
        return json.dumps(result, ensure_ascii=False)
        
    except Exception as e:
        print(f"搜索资源时出错: {str(e)}")
        return json.dumps({"error": f"搜索资源时出错: {str(e)}"}, ensure_ascii=False)

@tool
def save_resource_to_db(resource_data: Union[Dict[str, Any], str]) -> str:
    """
    将资源保存到数据库
    
    Args:
        resource_data: 可以是单个资源字典或资源列表的JSON字符串
        
    Returns:
        保存结果的JSON字符串
    """
    try:
        # 如果输入是字符串，尝试解析为JSON
        if isinstance(resource_data, str):
            try:
                resource_data = json.loads(resource_data)
            except json.JSONDecodeError:
                return json.dumps({
                    "status": "error",
                    "message": "Invalid JSON format"
                }, ensure_ascii=False)
        
        # 处理单个资源或资源列表
        if isinstance(resource_data, dict):
            resources = [resource_data]
        elif isinstance(resource_data, list):
            resources = resource_data
        else:
            return json.dumps({
                "status": "error",
                "message": "Resource data must be a dictionary or list"
            }, ensure_ascii=False)
        
        saved_resources = []
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        for resource in resources:
            # 确保必填字段存在
            if 'title' not in resource or not resource['title']:
                continue
                
            # 准备资源数据
            resource_to_save = {
                "title": resource.get('title', ''),
                "type": resource.get('type', '教案'),
                "content": resource.get('content', ''),
                "source_url": resource.get('url', resource.get('source_url', '')),
                "tags": resource.get('tags', '')
            }
            
            # 保存到数据库（同步方式）
            try:
                saved_resource = loop.run_until_complete(db_manager.create_resource(resource_to_save))
                if saved_resource:
                    saved_resources.append(saved_resource)
            except Exception as e:
                print(f"保存资源时出错: {str(e)}")
                continue
        
        loop.close()
        
        return json.dumps({
            "status": "success",
            "message": f"成功保存 {len(saved_resources)} 个资源",
            "saved_count": len(saved_resources),
            "saved_resources": saved_resources
        }, ensure_ascii=False)
        
    except Exception as e:
        return json.dumps({
            "status": "error",
            "message": f"保存资源时发生错误: {str(e)}"
        }, ensure_ascii=False)