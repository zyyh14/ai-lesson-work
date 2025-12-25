"""
收藏功能 - 简化版本
使用Supabase REST API直接操作
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from pydantic import BaseModel
import httpx
from ..core.config import settings

router = APIRouter()

# Supabase配置
SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_KEY = settings.SUPABASE_KEY
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# ============================================
# 数据模型
# ============================================

class FavoriteResourceRequest(BaseModel):
    resource_id: int
    notes: str = ""

class FavoriteExerciseRequest(BaseModel):
    exercise_id: int
    notes: str = ""

# ============================================
# 资源收藏接口
# ============================================

@router.post("/resources/favorite")
async def favorite_resource(request: FavoriteResourceRequest, user_id: int = Query(1)):
    """收藏教学资源"""
    try:
        async with httpx.AsyncClient() as client:
            # 检查是否已收藏
            check_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/resource_favorites",
                headers=HEADERS,
                params={
                    "user_id": f"eq.{user_id}",
                    "resource_id": f"eq.{request.resource_id}"
                }
            )
            
            # 检查响应状态码
            check_response.raise_for_status()
            existing_favorites = check_response.json()
            
            # 判断是否已收藏（检查返回的列表是否非空）
            if existing_favorites and len(existing_favorites) > 0:
                # 已收藏，更新备注
                response = await client.patch(
                    f"{SUPABASE_URL}/rest/v1/resource_favorites",
                    headers=HEADERS,
                    params={
                        "user_id": f"eq.{user_id}",
                        "resource_id": f"eq.{request.resource_id}"
                    },
                    json={"notes": request.notes}
                )
            else:
                # 新增收藏
                response = await client.post(
                    f"{SUPABASE_URL}/rest/v1/resource_favorites",
                    headers=HEADERS,
                    json={
                        "user_id": user_id,
                        "resource_id": request.resource_id,
                        "notes": request.notes or ""
                    }
                )
            
            # 检查响应状态码
            response.raise_for_status()
            result = response.json()
            
            # 处理返回结果
            if isinstance(result, list) and len(result) > 0:
                result_data = result[0]
            elif isinstance(result, dict):
                result_data = result
            else:
                result_data = {"id": None, "user_id": user_id, "resource_id": request.resource_id, "notes": request.notes}
            
            return {
                "status": "success",
                "message": "收藏成功",
                "data": result_data
            }
            
    except httpx.HTTPStatusError as e:
        # HTTP错误，提取详细错误信息
        error_detail = f"HTTP {e.response.status_code}: "
        try:
            error_body = e.response.json()
            if isinstance(error_body, dict):
                error_detail += error_body.get("message", error_body.get("error", str(e)))
            else:
                error_detail += str(error_body)
        except:
            error_detail += e.response.text or str(e)
        raise HTTPException(status_code=e.response.status_code, detail=error_detail)
    except httpx.RequestError as e:
        # 网络请求错误
        raise HTTPException(status_code=503, detail=f"无法连接到数据库: {str(e)}")
    except Exception as e:
        # 其他错误
        raise HTTPException(status_code=500, detail=f"收藏失败: {str(e)}")

@router.delete("/resources/favorite/{resource_id}")
async def unfavorite_resource(resource_id: int, user_id: int = Query(1)):
    """取消收藏资源"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{SUPABASE_URL}/rest/v1/resource_favorites",
                headers=HEADERS,
                params={
                    "user_id": f"eq.{user_id}",
                    "resource_id": f"eq.{resource_id}"
                }
            )
            
            response.raise_for_status()
            
            return {
                "status": "success",
                "message": "取消收藏成功"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/resources/favorites")
async def get_favorite_resources(
    user_id: int = Query(1),
    limit: int = Query(20, le=100),
    page: int = Query(1, gt=0)
):
    """获取收藏的资源列表"""
    try:
        offset = (page - 1) * limit
        
        async with httpx.AsyncClient() as client:
            # 获取收藏记录
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/resource_favorites",
                headers=HEADERS,
                params={
                    "user_id": f"eq.{user_id}",
                    "select": "*, resources(*)",
                    "order": "created_at.desc",
                    "limit": limit,
                    "offset": offset
                }
            )
            
            response.raise_for_status()
            favorites = response.json()
            
            # 获取总数
            count_response = await client.head(
                f"{SUPABASE_URL}/rest/v1/resource_favorites",
                headers={**HEADERS, "Prefer": "count=exact"},
                params={"user_id": f"eq.{user_id}"}
            )
            
            content_range = count_response.headers.get('content-range', '0')
            total = int(content_range.split('/')[-1]) if '/' in content_range else 0
            
            return {
                "favorites": favorites,
                "total": total,
                "page": page,
                "limit": limit
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# 练习题收藏接口
# ============================================

@router.post("/exercises/favorite")
async def favorite_exercise(request: FavoriteExerciseRequest, user_id: int = Query(1)):
    """收藏练习题"""
    try:
        # 验证exercise_id是否有效
        if not request.exercise_id or request.exercise_id <= 0:
            raise HTTPException(status_code=400, detail="无效的练习题ID")
        
        async with httpx.AsyncClient() as client:
            # 首先验证user_id是否存在
            user_check = await client.get(
                f"{SUPABASE_URL}/rest/v1/users",
                headers=HEADERS,
                params={"id": f"eq.{user_id}", "select": "id"}
            )
            user_check.raise_for_status()
            user_exists = user_check.json()
            
            if not user_exists or len(user_exists) == 0:
                raise HTTPException(status_code=404, detail=f"用户ID {user_id} 不存在，请先创建用户")
            
            # 验证练习题是否存在
            exercise_check = await client.get(
                f"{SUPABASE_URL}/rest/v1/exercises",
                headers=HEADERS,
                params={"id": f"eq.{request.exercise_id}", "select": "id"}
            )
            exercise_check.raise_for_status()
            exercise_exists = exercise_check.json()
            
            if not exercise_exists or len(exercise_exists) == 0:
                raise HTTPException(status_code=404, detail=f"练习题ID {request.exercise_id} 不存在")
            
            # 检查是否已收藏
            check_response = await client.get(
                f"{SUPABASE_URL}/rest/v1/exercise_favorites",
                headers=HEADERS,
                params={
                    "user_id": f"eq.{user_id}",
                    "exercise_id": f"eq.{request.exercise_id}"
                }
            )
            
            # 检查响应状态码
            check_response.raise_for_status()
            existing_favorites = check_response.json()
            
            # 判断是否已收藏（检查返回的列表是否非空）
            if existing_favorites and isinstance(existing_favorites, list) and len(existing_favorites) > 0:
                # 已收藏，更新备注
                print(f"练习题已收藏，更新备注: user_id={user_id}, exercise_id={request.exercise_id}")
                response = await client.patch(
                    f"{SUPABASE_URL}/rest/v1/exercise_favorites",
                    headers=HEADERS,
                    params={
                        "user_id": f"eq.{user_id}",
                        "exercise_id": f"eq.{request.exercise_id}"
                    },
                    json={"notes": request.notes or ""}
                )
                print(f"更新响应状态码: {response.status_code}")
            else:
                # 新增收藏
                print(f"准备收藏练习题: user_id={user_id}, exercise_id={request.exercise_id}, notes={request.notes}")
                favorite_data = {
                    "user_id": user_id,
                    "exercise_id": request.exercise_id,
                    "notes": request.notes or ""
                }
                print(f"收藏数据: {favorite_data}")
                
                response = await client.post(
                    f"{SUPABASE_URL}/rest/v1/exercise_favorites",
                    headers=HEADERS,
                    json=favorite_data
                )
                
                print(f"收藏响应状态码: {response.status_code}")
                print(f"收藏响应头: {dict(response.headers)}")
            
            # 检查响应状态码（Supabase POST可能返回201 Created）
            if response.status_code not in [200, 201]:
                response.raise_for_status()
            
            # 获取响应内容
            response_text = response.text
            print(f"收藏响应内容: {response_text}")
            
            result_data = None
            try:
                result = response.json()
                print(f"收藏响应JSON: {result}")
                
                # 处理返回结果
                if isinstance(result, list) and len(result) > 0:
                    result_data = result[0]
                    print(f"从列表获取结果: {result_data}")
                elif isinstance(result, dict):
                    result_data = result
                    print(f"从字典获取结果: {result_data}")
                else:
                    # 如果返回格式不符合预期，验证是否真的插入成功
                    print(f"返回格式异常，验证插入结果: result={result}, type={type(result)}")
                    verify_response = await client.get(
                        f"{SUPABASE_URL}/rest/v1/exercise_favorites",
                        headers=HEADERS,
                        params={
                            "user_id": f"eq.{user_id}",
                            "exercise_id": f"eq.{request.exercise_id}"
                        }
                    )
                    verify_response.raise_for_status()
                    verify_result = verify_response.json()
                    if verify_result and isinstance(verify_result, list) and len(verify_result) > 0:
                        result_data = verify_result[0]
                        print(f"验证成功，收藏已保存: {result_data}")
                    else:
                        raise HTTPException(status_code=500, detail="收藏操作可能失败，验证时未找到记录")
            except ValueError as e:
                # JSON解析失败
                print(f"解析响应JSON失败: {e}, 响应文本: {response_text}")
                # 如果响应为空或不是JSON，可能是插入成功但没有返回数据
                # 这种情况下，我们需要验证是否真的插入成功
                if response.status_code in [200, 201]:
                    # 验证是否真的插入成功
                    verify_response = await client.get(
                        f"{SUPABASE_URL}/rest/v1/exercise_favorites",
                        headers=HEADERS,
                        params={
                            "user_id": f"eq.{user_id}",
                            "exercise_id": f"eq.{request.exercise_id}"
                        }
                    )
                    verify_response.raise_for_status()
                    verify_result = verify_response.json()
                    if verify_result and isinstance(verify_result, list) and len(verify_result) > 0:
                        result_data = verify_result[0]
                        print(f"验证成功，收藏已保存: {result_data}")
                    else:
                        raise HTTPException(status_code=500, detail="收藏操作可能失败，验证时未找到记录")
                else:
                    raise HTTPException(status_code=response.status_code, detail=f"收藏失败: {response_text}")
            
            # 确保result_data不为None
            if result_data is None:
                raise HTTPException(status_code=500, detail="无法获取收藏结果数据")
            
            return {
                "status": "success",
                "message": "收藏成功",
                "data": result_data
            }
            
    except HTTPException:
        raise
    except httpx.HTTPStatusError as e:
        # HTTP错误，提取详细错误信息
        error_detail = f"HTTP {e.response.status_code}: "
        try:
            error_body = e.response.json()
            if isinstance(error_body, dict):
                error_detail += error_body.get("message", error_body.get("error", error_body.get("hint", str(e))))
            else:
                error_detail += str(error_body)
        except:
            error_detail += e.response.text or str(e)
        print(f"收藏练习题失败: {error_detail}")
        raise HTTPException(status_code=e.response.status_code, detail=error_detail)
    except httpx.RequestError as e:
        # 网络请求错误
        print(f"网络请求错误: {str(e)}")
        raise HTTPException(status_code=503, detail=f"无法连接到数据库: {str(e)}")
    except Exception as e:
        # 其他错误
        print(f"收藏练习题时发生未知错误: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"收藏失败: {str(e)}")

@router.delete("/exercises/favorite/{exercise_id}")
async def unfavorite_exercise(exercise_id: int, user_id: int = Query(1)):
    """取消收藏练习题"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{SUPABASE_URL}/rest/v1/exercise_favorites",
                headers=HEADERS,
                params={
                    "user_id": f"eq.{user_id}",
                    "exercise_id": f"eq.{exercise_id}"
                }
            )
            
            response.raise_for_status()
            
            return {
                "status": "success",
                "message": "取消收藏成功"
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/exercises/favorites")
async def get_favorite_exercises(
    user_id: int = Query(1),
    limit: int = Query(20, le=100),
    page: int = Query(1, gt=0)
):
    """获取收藏的练习题列表"""
    try:
        offset = (page - 1) * limit
        
        async with httpx.AsyncClient() as client:
            # 获取收藏记录
            response = await client.get(
                f"{SUPABASE_URL}/rest/v1/exercise_favorites",
                headers=HEADERS,
                params={
                    "user_id": f"eq.{user_id}",
                    "select": "*, exercises(*)",
                    "order": "created_at.desc",
                    "limit": limit,
                    "offset": offset
                }
            )
            
            response.raise_for_status()
            favorites = response.json()
            
            # 获取总数
            count_response = await client.head(
                f"{SUPABASE_URL}/rest/v1/exercise_favorites",
                headers={**HEADERS, "Prefer": "count=exact"},
                params={"user_id": f"eq.{user_id}"}
            )
            
            content_range = count_response.headers.get('content-range', '0')
            total = int(content_range.split('/')[-1]) if '/' in content_range else 0
            
            return {
                "favorites": favorites,
                "total": total,
                "page": page,
                "limit": limit
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
