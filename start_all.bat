@echo off
echo ============================================================
echo           TeacherAI Workspace - 一键启动脚本
echo ============================================================

:: 1. 启动 Python 服务 (Port 5000)
echo [1/3] 正在启动 Python AI 服务 (FastAPI)...
start "Python AI Service" cmd /k "cd python_service && python start.py"

:: 2. 启动 Java 后端 (Port 8081)
echo [2/3] 正在启动 Java 后端服务 (Spring Boot)...
start "Java Backend" cmd /k "cd backend && mvn spring-boot:run"

:: 3. 启动前端模块 (Vite)
:: 注意：前端是 Monorepo 结构，每个模块独立启动。这里启动主要的 PPT 模块作为示例。
echo [3/3] 正在启动前端 PPT 模块 (Vite)...
start "Frontend PPT" cmd /k "cd frontend\modules\ppt && npm run dev"

echo.
echo ============================================================
echo 服务启动指令已发出，请检查各弹出的窗口状态：
echo - Python 服务: http://localhost:5000
echo - Java 后端: http://localhost:8081
echo - 前端 PPT: http://localhost:5173 (通常端口)
echo ============================================================
pause
