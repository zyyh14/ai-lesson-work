from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import httpx
from ..services.exercise_service import exercise_generator
from ..core.config import settings

router = APIRouter()

# Supabase配置
SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_KEY = settings.SUPABASE_KEY
SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}


class ExerciseRequest(BaseModel):
    """练习题生成请求模型"""
    knowledge_point: str = Field(..., description="知识点，例如：'李白《静夜思》'", min_length=1)


class ExerciseItem(BaseModel):
    """单个练习题模型"""
    id: Optional[int] = None  # 数据库ID（保存到数据库后会有值）
    type: str
    question: str
    answer: str
    explanation: str
    options: Optional[List[str]] = None


class ExerciseResponse(BaseModel):
    """练习题响应模型"""
    knowledge_point: str
    exercises: List[ExerciseItem]
    total_count: int
    status: str


@router.post("/exercises/generate", response_model=ExerciseResponse)
async def generate_exercises(request: ExerciseRequest):
    """
    根据知识点生成3道练习题
    
    会生成以下类型的题目：
    - 选择题（1道）
    - 填空题（1道）
    - 简答题（1道）
    """
    try:
        # 调用同步方法生成练习题
        result = exercise_generator.generate_exercises_sync(request.knowledge_point)
        
        # 检查是否有错误
        if result.get("status") == "error":
            error_detail = result.get("error", "未知错误")
            print(f"生成练习题时出错: {error_detail}")
            if "raw_output" in result:
                print(f"原始响应: {result['raw_output']}")
            raise HTTPException(status_code=500, detail=error_detail)
        
        # 转换exercises为ExerciseItem列表
        exercises = []
        for i, ex in enumerate(result.get("exercises", [])):
            try:
                # 确保每个练习都有必要字段
                if not all(key in ex for key in ["type", "question", "answer"]):
                    print(f"警告: 练习 {i} 缺少必要字段: {ex}")
                    continue
                    
                # 处理可能的选项字段
                if ex["type"] == "选择题" and "options" not in ex:
                    print(f"警告: 选择题 {i} 缺少 options 字段")
                    ex["options"] = ["A", "B", "C", "D"]  # 提供默认选项
                    
                exercises.append(ExerciseItem(**ex))
            except Exception as e:
                print(f"处理练习 {i} 时出错: {str(e)}")
                continue
                
        # 检查是否有成功生成的练习
        if not exercises:
            raise HTTPException(status_code=500, detail="未能生成有效的练习题")
        
        # 保存练习题到数据库
        saved_exercises = []
        async with httpx.AsyncClient() as client:
            for idx, exercise in enumerate(exercises):
                try:
                    # 准备保存的数据
                    exercise_data = {
                        "knowledge_point": result["knowledge_point"],
                        "type": exercise.type,
                        "question": exercise.question,
                        "answer": exercise.answer,
                        "explanation": exercise.explanation or "",
                        "options": exercise.options if exercise.options else None
                    }
                    
                    print(f"正在保存第 {idx + 1} 道练习题: {exercise.type}")
                    
                    # 保存到Supabase
                    response = await client.post(
                        f"{SUPABASE_URL}/rest/v1/exercises",
                        headers=SUPABASE_HEADERS,
                        json=exercise_data
                    )
                    
                    # 检查响应状态码（Supabase POST可能返回201 Created）
                    if response.status_code not in [200, 201]:
                        response.raise_for_status()
                    
                    saved_exercise = response.json()
                    print(f"保存响应: {saved_exercise}")
                    
                    # 处理返回结果（Supabase通常返回列表）
                    exercise_id = None
                    if isinstance(saved_exercise, list) and len(saved_exercise) > 0:
                        exercise_id = saved_exercise[0].get("id")
                    elif isinstance(saved_exercise, dict):
                        exercise_id = saved_exercise.get("id")
                    
                    # 确保获取到有效的ID
                    if exercise_id is None:
                        raise ValueError(f"保存练习题失败：未获取到有效的ID，响应: {saved_exercise}")
                    
                    # 确保ID是整数类型
                    exercise_id = int(exercise_id)
                    print(f"成功保存练习题，ID: {exercise_id}")
                    
                    # 创建包含ID的练习题对象
                    # 使用兼容的方式获取字典（支持 Pydantic v1 和 v2）
                    try:
                        # Pydantic v2
                        saved_exercise_dict = exercise.model_dump()
                    except AttributeError:
                        # Pydantic v1
                        saved_exercise_dict = exercise.dict()
                    
                    saved_exercise_dict['id'] = exercise_id
                    saved_exercise_item = ExerciseItem(**saved_exercise_dict)
                    saved_exercises.append(saved_exercise_item)
                    
                except httpx.HTTPStatusError as e:
                    # 如果保存失败，记录详细错误并抛出异常
                    error_detail = f"保存第 {idx + 1} 道练习题失败: HTTP {e.response.status_code}"
                    try:
                        error_body = e.response.json()
                        if isinstance(error_body, dict):
                            error_detail += f" - {error_body.get('message', error_body.get('error', error_body.get('hint', '')))}"
                        else:
                            error_detail += f" - {error_body}"
                    except:
                        error_detail += f" - {e.response.text}"
                    print(error_detail)
                    raise HTTPException(status_code=500, detail=error_detail)
                except ValueError as e:
                    # ID获取失败
                    error_detail = f"保存第 {idx + 1} 道练习题失败: {str(e)}"
                    print(error_detail)
                    raise HTTPException(status_code=500, detail=error_detail)
                except Exception as e:
                    # 其他错误
                    error_detail = f"保存第 {idx + 1} 道练习题时出错: {str(e)}"
                    print(error_detail)
                    import traceback
                    traceback.print_exc()
                    raise HTTPException(status_code=500, detail=error_detail)
        
        # 确保所有练习题都成功保存
        if len(saved_exercises) != len(exercises):
            raise HTTPException(
                status_code=500, 
                detail=f"保存失败：期望保存 {len(exercises)} 道题，实际保存 {len(saved_exercises)} 道题"
            )
        
        return ExerciseResponse(
            knowledge_point=result["knowledge_point"],
            exercises=saved_exercises,
            total_count=result["total_count"],
            status=result["status"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成练习题时出错: {str(e)}")








