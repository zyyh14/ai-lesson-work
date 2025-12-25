from typing import List, Dict, Any
from langchain_community.chat_models import ChatZhipuAI
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnableSequence
import json
import os

from ..core.config import settings


class ExerciseGenerator:
    """练习题生成服务"""
    
    def __init__(self):
        # 使用智谱AI
        self.llm = ChatZhipuAI(
            model="glm-4",  # 使用智谱AI的glm-4模型
            zhipuai_api_key=settings.ZHIPU_API_KEY,
            temperature=0.7
        )
        
        # 练习题生成提示模板
        self.prompt_template = PromptTemplate(
            input_variables=["knowledge_point"],
            template="""
你是一位经验丰富的教师，擅长根据知识点生成高质量的练习题。

请根据以下知识点，生成3道不同类型的练习题（选择题、填空题、简答题各1道）。

知识点：{knowledge_point}

要求：
1. 题目要贴合知识点，难度适中
2. 选择题应该有4个选项，只有1个正确答案
3. 填空题应该明确标注空白位置
4. 简答题应该能够考察学生对知识点的理解和应用

请按照以下JSON格式返回：
{{
    "exercises": [
        {{
            "type": "选择题",
            "question": "题目内容",
            "options": ["选项A", "选项B", "选项C", "选项D"],
            "answer": "正确答案（例如：A）",
            "explanation": "解析说明"
        }},
        {{
            "type": "填空题",
            "question": "题目内容，用___表示空白",
            "answer": "正确答案",
            "explanation": "解析说明"
        }},
        {{
            "type": "简答题",
            "question": "题目内容",
            "answer": "参考答案",
            "explanation": "评分要点说明"
        }}
    ]
}}

只返回JSON，不要返回其他文字说明。
"""
        )
        
        # 使用新的API创建chain
        self.chain = self.prompt_template | self.llm
    
    async def generate_exercises(self, knowledge_point: str) -> Dict[str, Any]:
        """
        根据知识点生成练习题
        
        Args:
            knowledge_point: 知识点（例如："李白《静夜思》"）
            
        Returns:
            包含练习题列表的字典
        """
        try:
            # 调用LLM生成练习题
            result = await self.chain.ainvoke({
                "knowledge_point": knowledge_point
            })
            
            output = result.content if hasattr(result, 'content') else str(result)
            
            # 尝试解析JSON
            # LLM可能返回带markdown代码块的JSON，需要提取
            if "```json" in output:
                json_start = output.find("```json") + 7
                json_end = output.find("```", json_start)
                output = output[json_start:json_end].strip()
            elif "```" in output:
                json_start = output.find("```") + 3
                json_end = output.find("```", json_start)
                output = output[json_start:json_end].strip()
            
            exercises_data = json.loads(output)
            
            return {
                "knowledge_point": knowledge_point,
                "exercises": exercises_data.get("exercises", []),
                "total_count": len(exercises_data.get("exercises", [])),
                "status": "success"
            }
            
        except json.JSONDecodeError as e:
            # 如果JSON解析失败，尝试手动提取
            return {
                "knowledge_point": knowledge_point,
                "error": f"JSON解析错误: {str(e)}",
                "raw_output": output if 'output' in locals() else "",
                "status": "error"
            }
        except Exception as e:
            print(f"生成练习题时出错: {str(e)}")
            return {
                "knowledge_point": knowledge_point,
                "exercises": [],
                "error": f"生成练习题时发生错误: {str(e)}",
                "status": "error"
            }
    
    def generate_exercises_sync(self, knowledge_point: str) -> Dict[str, Any]:
        """同步版本的生成练习题方法"""
        try:
            # 调用LLM生成响应
            response = self.chain.invoke({
                "knowledge_point": knowledge_point
            })
            
            # 获取响应文本
            output = response.content if hasattr(response, 'content') else str(response)
            
            # 清理响应文本，移除可能的Markdown代码块标记
            if '```json' in output:
                output = output.split('```json')[1].split('```')[0].strip()
            elif '```' in output:
                output = output.split('```')[1].strip()
            
            # 解析JSON响应
            result = json.loads(output)
            
            # 验证响应格式
            if not isinstance(result, dict) or 'exercises' not in result:
                raise ValueError("Invalid response format: missing 'exercises' key")
                
            if not isinstance(result['exercises'], list):
                raise ValueError("Invalid response format: 'exercises' is not a list")
                
            # 确保每个练习都有必要的字段
            for i, exercise in enumerate(result['exercises']):
                if 'type' not in exercise or 'question' not in exercise or 'answer' not in exercise:
                    raise ValueError(f"Exercise at index {i} is missing required fields")
            
            return {
                "knowledge_point": knowledge_point,
                "exercises": result['exercises'],
                "total_count": len(result['exercises']),
                "status": "success"
            }
            
        except json.JSONDecodeError as e:
            print(f"JSON解析错误: {e}")
            print(f"原始响应: {output}")
            return {
                "knowledge_point": knowledge_point,
                "error": f"JSON解析错误: {str(e)}",
                "raw_output": output if 'output' in locals() else "",
                "status": "error"
            }
        except Exception as e:
            print(f"生成练习题时出错: {str(e)}")
            return {
                "knowledge_point": knowledge_point,
                "error": str(e),
                "raw_output": output if 'output' in locals() else "",
                "status": "error"
            }


# 创建单例实例
exercise_generator = ExerciseGenerator()









