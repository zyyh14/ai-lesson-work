#!/usr/bin/env python3
import asyncio
import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.tools.search_tools import tavily_search
from app.db.database import db_manager
from app.core.config import settings

async def test_search_api():
    """测试搜索API的各个步骤"""
    query = "水循环"
    
    print(f"1. 测试配置...")
    print(f"   SUPABASE_URL: {settings.SUPABASE_URL}")
    print(f"   SUPABASE_KEY: {settings.SUPABASE_KEY[:20]}...")
    print(f"   ZHIPU_API_KEY: {settings.ZHIPU_API_KEY[:20]}...")
    print(f"   TAVILY_API_KEY: {settings.TAVILY_API_KEY[:20]}...")
    
    print(f"\n2. 测试Tavily搜索...")
    try:
        search_results = tavily_search(query)
        print(f"   搜索结果: {search_results[:200]}...")
    except Exception as e:
        print(f"   搜索失败: {e}")
        return
    
    print(f"\n3. 测试数据库连接...")
    try:
        # 尝试创建一个简单的资源
        resource_data = {
            "title": f"{query} - 测试资源",
            "type": "教案",
            "content": "这是一个测试资源",
            "source_url": "http://test.com",
            "tags": query
        }
        
        saved_resource = await db_manager.create_resource(resource_data)
        print(f"   数据库保存成功: {saved_resource}")
        
    except Exception as e:
        print(f"   数据库保存失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_search_api())