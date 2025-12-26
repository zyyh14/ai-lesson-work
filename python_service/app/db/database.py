from typing import Optional, Dict, Any, List, Union
import httpx
import json
from fastapi import HTTPException
from ..core.config import settings

class DatabaseManager:
    def __init__(self):
        self.base_url = f"{settings.SUPABASE_URL}/rest/v1"
        self.headers = {
            "apikey": settings.SUPABASE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
    
    async def _make_request(self, method: str, endpoint: str, **kwargs) -> Any:
        """统一的请求方法"""
        url = f"{self.base_url}/{endpoint}"
        
        # 对于HEAD请求，不尝试解析JSON响应
        is_head = method.upper() == 'HEAD'
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.request(
                    method=method,
                    url=url,
                    headers=self.headers,
                    **kwargs
                )
                response.raise_for_status()
                
                # 对于HEAD请求，直接返回响应对象
                if is_head:
                    return response
                    
                # 对于其他请求，返回解析后的JSON
                if response.content:
                    try:
                        return response.json()
                    except json.JSONDecodeError:
                        return response.text
                return None
                
            except httpx.HTTPStatusError as e:
                error_detail = {
                    "status_code": e.response.status_code,
                    "detail": e.response.text,
                    "url": str(e.request.url),
                }
                raise HTTPException(
                    status_code=e.response.status_code,
                    detail=error_detail
                )
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail={"error": str(e), "type": type(e).__name__}
                )

    
    async def get_resource(self, resource_id: Union[int, str]) -> Optional[Dict[str, Any]]:
        """根据ID获取单个资源"""
        endpoint = f"resources?id=eq.{resource_id}"
        result = await self._make_request("GET", endpoint)
        return result[0] if result else None
    
    async def search_resources(
        self, 
        query: str, 
        resource_type: Optional[str] = None,
        limit: int = 10,
        page: int = 1
    ) -> Dict[str, Any]:
        """
        搜索资源，支持分页和过滤
        
        Args:
            query: 搜索关键词
            resource_type: 资源类型过滤
            limit: 每页数量
            page: 页码
            
        Returns:
            {
                'data': List[Dict],  # 资源列表
                'total': int,        # 总记录数
                'page': int,         # 当前页码
                'page_size': int,    # 每页数量
                'total_pages': int   # 总页数
            }
        """
        offset = (page - 1) * limit
        
        # 构建查询参数
        params = {
            'select': '*',
            'order': 'created_at.desc',
            'limit': limit,
            'offset': offset,
            'or': f'(title.ilike.*{query}*,tags.ilike.*{query}*)'
        }
        
        if resource_type:
            params['type'] = f'eq.{resource_type}'
        
        # 获取数据
        data = await self._make_request('GET', 'resources', params=params)
        
        # 获取总数 - 使用Prefer: count=exact头
        count_params = params.copy()
        count_headers = self.headers.copy()
        count_headers['Prefer'] = 'count=exact'
        
        async with httpx.AsyncClient() as client:
            try:
                count_response = await client.head(
                    f"{self.base_url}/resources",
                    headers=count_headers,
                    params=count_params
                )
                
                # 解析content-range头，格式可能是 "0-9/100" 或 "*/0"
                content_range = count_response.headers.get('content-range', '0')
                if '/' in content_range:
                    total_str = content_range.split('/')[-1]
                    total_count = int(total_str) if total_str != '*' else 0
                else:
                    total_count = 0
                    
            except Exception as e:
                print(f"获取总数失败: {str(e)}")
                total_count = len(data) if data else 0
        
        return {
            'data': data or [],
            'total': total_count,
            'page': page,
            'page_size': limit,
            'total_pages': (total_count + limit - 1) // limit if limit > 0 else 0
        }
    
    async def create_resource(self, resource_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        创建新资源
        
        Args:
            resource_data: 资源数据，包含 title, type, content 等字段
            
        Returns:
            创建成功的资源数据
        """
        # 确保必填字段存在
        required_fields = ['title', 'type']
        for field in required_fields:
            if field not in resource_data:
                raise HTTPException(
                    status_code=400,
                    detail={"error": f"Missing required field: {field}"}
                )
                
        # 添加默认值
        resource_data.setdefault('tags', '')
        resource_data.setdefault('source_url', '')
        
        # 发送创建请求
        result = await self._make_request(
            'POST', 
            'resources', 
            json=resource_data
        )
        
        # 返回创建的资源
        return result[0] if isinstance(result, list) else result
    
    async def update_resource(self, resource_id: Union[int, str], update_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        更新资源
        
        Args:
            resource_id: 资源ID
            update_data: 要更新的字段和值
            
        Returns:
            更新后的资源数据
        """
        if not update_data:
            raise HTTPException(
                status_code=400,
                detail={"error": "No update data provided"}
            )
            
        # 发送更新请求
        endpoint = f"resources?id=eq.{resource_id}"
        result = await self._make_request(
            'PATCH',
            endpoint,
            json=update_data
        )
        
        # 获取更新后的资源
        updated_resource = await self.get_resource(resource_id)
        if not updated_resource:
            raise HTTPException(
                status_code=404,
                detail={"error": f"Resource with id {resource_id} not found after update"}
            )
            
        return updated_resource
    
    async def delete_resource(self, resource_id: Union[int, str]) -> bool:
        """
        删除资源
        
        Args:
            resource_id: 要删除的资源ID
            
        Returns:
            bool: 是否删除成功
        """
        # 先检查资源是否存在
        resource = await self.get_resource(resource_id)
        if not resource:
            raise HTTPException(
                status_code=404,
                detail={"error": f"Resource with id {resource_id} not found"}
            )
            
        # 发送删除请求
        endpoint = f"resources?id=eq.{resource_id}"
        await self._make_request('DELETE', endpoint)
        
        # 验证是否删除成功
        deleted_resource = await self.get_resource(resource_id)
        return deleted_resource is None

# Create a singleton instance
db_manager = DatabaseManager()
