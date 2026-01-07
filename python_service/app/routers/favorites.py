from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any
from pydantic import BaseModel
from ..db.database import db_manager

router = APIRouter()

# ============================================
# 数据模型
# ============================================

class FavoriteResourceRequest(BaseModel):
    resource_id: int
    notes: str = ""

class FavoriteExerciseRequest(BaseModel):
    exercise_id: int
    notes: str = ""

class CollectionCreate(BaseModel):
    name: str
    description: str = ""

class CollectionItemAdd(BaseModel):
    item_type: str  # resource 或 exercise
    item_id: int

# ============================================
# 资源收藏接口
# ============================================

@router.post("/resources/favorite")
async def favorite_resource(request: FavoriteResourceRequest, user_id: int = Query(1)):
    """收藏教学资源"""
    try:
        # 检查资源是否存在
        resource = await db_manager.get_resource(request.resource_id)
        if not resource:
            raise HTTPException(status_code=404, detail="资源不存在")
        
        # 添加收藏
        query = """
            INSERT INTO resource_favorites (user_id, resource_id, notes)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, resource_id) 
            DO UPDATE SET notes = $3, created_at = NOW()
            RETURNING id, created_at
        """
        
        result = await db_manager._execute_query(
            query, 
            user_id, 
            request.resource_id, 
            request.notes
        )
        
        return {
            "status": "success",
            "message": "收藏成功",
            "favorite_id": result[0]['id']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/resources/favorite/{resource_id}")
async def unfavorite_resource(resource_id: int, user_id: int = Query(1)):
    """取消收藏资源"""
    try:
        query = """
            DELETE FROM resource_favorites 
            WHERE user_id = $1 AND resource_id = $2
            RETURNING id
        """
        
        result = await db_manager._execute_query(query, user_id, resource_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="未找到该收藏")
        
        return {
            "status": "success",
            "message": "取消收藏成功"
        }
        
    except HTTPException:
        raise
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
        
        query = """
            SELECT 
                r.*,
                rf.notes as favorite_notes,
                rf.created_at as favorited_at
            FROM resources r
            JOIN resource_favorites rf ON r.id = rf.resource_id
            WHERE rf.user_id = $1
            ORDER BY rf.created_at DESC
            LIMIT $2 OFFSET $3
        """
        
        resources = await db_manager._execute_query(query, user_id, limit, offset)
        
        # 获取总数
        count_query = """
            SELECT COUNT(*) as total
            FROM resource_favorites
            WHERE user_id = $1
        """
        count_result = await db_manager._execute_query(count_query, user_id)
        total = count_result[0]['total'] if count_result else 0
        
        return {
            "resources": resources,
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
        # 检查练习题是否存在
        check_query = "SELECT id FROM exercises WHERE id = $1"
        exercise = await db_manager._execute_query(check_query, request.exercise_id)
        
        if not exercise:
            raise HTTPException(status_code=404, detail="练习题不存在")
        
        # 添加收藏
        query = """
            INSERT INTO exercise_favorites (user_id, exercise_id, notes)
            VALUES ($1, $2, $3)
            ON CONFLICT (user_id, exercise_id) 
            DO UPDATE SET notes = $3, created_at = NOW()
            RETURNING id, created_at
        """
        
        result = await db_manager._execute_query(
            query, 
            user_id, 
            request.exercise_id, 
            request.notes
        )
        
        return {
            "status": "success",
            "message": "收藏成功",
            "favorite_id": result[0]['id']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/exercises/favorite/{exercise_id}")
async def unfavorite_exercise(exercise_id: int, user_id: int = Query(1)):
    """取消收藏练习题"""
    try:
        query = """
            DELETE FROM exercise_favorites 
            WHERE user_id = $1 AND exercise_id = $2
            RETURNING id
        """
        
        result = await db_manager._execute_query(query, user_id, exercise_id)
        
        if not result:
            raise HTTPException(status_code=404, detail="未找到该收藏")
        
        return {
            "status": "success",
            "message": "取消收藏成功"
        }
        
    except HTTPException:
        raise
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
        
        query = """
            SELECT 
                e.*,
                ef.notes as favorite_notes,
                ef.created_at as favorited_at
            FROM exercises e
            JOIN exercise_favorites ef ON e.id = ef.exercise_id
            WHERE ef.user_id = $1
            ORDER BY ef.created_at DESC
            LIMIT $2 OFFSET $3
        """
        
        exercises = await db_manager._execute_query(query, user_id, limit, offset)
        
        # 获取总数
        count_query = """
            SELECT COUNT(*) as total
            FROM exercise_favorites
            WHERE user_id = $1
        """
        count_result = await db_manager._execute_query(count_query, user_id)
        total = count_result[0]['total'] if count_result else 0
        
        return {
            "exercises": exercises,
            "total": total,
            "page": page,
            "limit": limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# 收藏夹管理接口
# ============================================

@router.post("/collections")
async def create_collection(request: CollectionCreate, user_id: int = Query(1)):
    """创建收藏夹"""
    try:
        query = """
            INSERT INTO collections (user_id, name, description)
            VALUES ($1, $2, $3)
            RETURNING id, name, description, created_at
        """
        
        result = await db_manager._execute_query(
            query, 
            user_id, 
            request.name, 
            request.description
        )
        
        return {
            "status": "success",
            "collection": result[0]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/collections")
async def get_collections(user_id: int = Query(1)):
    """获取用户的所有收藏夹"""
    try:
        query = """
            SELECT 
                c.*,
                COUNT(ci.id) as item_count
            FROM collections c
            LEFT JOIN collection_items ci ON c.id = ci.collection_id
            WHERE c.user_id = $1
            GROUP BY c.id
            ORDER BY c.created_at DESC
        """
        
        collections = await db_manager._execute_query(query, user_id)
        
        return {
            "collections": collections
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/collections/{collection_id}/items")
async def add_to_collection(
    collection_id: int, 
    request: CollectionItemAdd,
    user_id: int = Query(1)
):
    """添加项目到收藏夹"""
    try:
        # 验证收藏夹所有权
        check_query = "SELECT id FROM collections WHERE id = $1 AND user_id = $2"
        collection = await db_manager._execute_query(check_query, collection_id, user_id)
        
        if not collection:
            raise HTTPException(status_code=404, detail="收藏夹不存在或无权限")
        
        # 添加项目
        query = """
            INSERT INTO collection_items (collection_id, item_type, item_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (collection_id, item_type, item_id) DO NOTHING
            RETURNING id
        """
        
        result = await db_manager._execute_query(
            query, 
            collection_id, 
            request.item_type, 
            request.item_id
        )
        
        return {
            "status": "success",
            "message": "添加成功"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/collections/{collection_id}/items")
async def get_collection_items(
    collection_id: int,
    user_id: int = Query(1)
):
    """获取收藏夹中的所有项目"""
    try:
        # 验证收藏夹所有权
        check_query = "SELECT id FROM collections WHERE id = $1 AND user_id = $2"
        collection = await db_manager._execute_query(check_query, collection_id, user_id)
        
        if not collection:
            raise HTTPException(status_code=404, detail="收藏夹不存在或无权限")
        
        # 获取项目
        query = """
            SELECT 
                ci.id,
                ci.item_type,
                ci.item_id,
                ci.created_at,
                CASE 
                    WHEN ci.item_type = 'resource' THEN r.title
                    WHEN ci.item_type = 'exercise' THEN e.question
                END as title,
                CASE 
                    WHEN ci.item_type = 'resource' THEN r.type
                    WHEN ci.item_type = 'exercise' THEN e.type
                END as type
            FROM collection_items ci
            LEFT JOIN resources r ON ci.item_type = 'resource' AND ci.item_id = r.id
            LEFT JOIN exercises e ON ci.item_type = 'exercise' AND ci.item_id = e.id
            WHERE ci.collection_id = $1
            ORDER BY ci.created_at DESC
        """
        
        items = await db_manager._execute_query(query, collection_id)
        
        return {
            "items": items
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
