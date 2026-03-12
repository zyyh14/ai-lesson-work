from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .routers import resources, exercises, favorites_simple

# 创建FastAPI应用实例
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI教学资源管理与智能推荐服务",
    version="1.0.0",
    debug=settings.DEBUG
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(resources.router, prefix=f"{settings.API_V1_STR}/resources", tags=["教学资源"])
app.include_router(exercises.router, prefix=settings.API_V1_STR, tags=["练习题生成"])
app.include_router(favorites_simple.router, prefix=f"{settings.API_V1_STR}/favorites", tags=["收藏管理"])

# 添加简化版搜索路由
from .routers import resources_simple
app.include_router(resources_simple.router, prefix=f"{settings.API_V1_STR}/resources", tags=["教学资源-简化版"])

@app.get("/")
async def root():
    """根路径，返回API信息"""
    return {
        "message": "AI Teaching Resource Agent API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)