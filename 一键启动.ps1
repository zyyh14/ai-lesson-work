# 一键启动脚本
$host.UI.RawUI.WindowTitle = "AI智能备课系统 - 一键启动"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "          AI智能备课系统 - 一键启动脚本" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. 启动 Python 服务
Write-Host "[1/6] 正在启动 Python AI 服务..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd python_service; python start.py"

# 2. 启动 Java 后端
Write-Host "[2/6] 正在启动 Java 后端服务..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; mvn spring-boot:run"

# 3. 启动前端模块
Write-Host "[3/6] 正在启动 PPT 模块..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend/modules/ppt; npm run dev"

Write-Host "[4/6] 正在启动 教案模块..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend/modules/lessonplan; npm run dev"

Write-Host "[5/6] 正在启动 资源管理模块..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend/modules/resource; npm run dev"

Write-Host "[6/6] 正在启动 学情分析模块..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend/modules/wystudy_analysis; npm run dev"

Write-Host "`n服务启动指令已发出，请检查各弹出窗口状态。" -ForegroundColor Yellow
Write-Host "Dashboard首页: http://localhost:3001" -ForegroundColor White
Write-Host "============================================================" -ForegroundColor Cyan
Pause
