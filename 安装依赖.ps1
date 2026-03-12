# 安装依赖脚本
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "          AI智能备课系统 - 依赖安装脚本" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Python 依赖
Write-Host "[1/5] 正在安装 Python 依赖..." -ForegroundColor Green
cd python_service
pip install -r requirements.txt
cd ..

# 2. 前端 PPT 模块
Write-Host "[2/5] 正在安装 PPT 模块依赖..." -ForegroundColor Green
cd frontend/modules/ppt
npm install --legacy-peer-deps
cd ../../..

# 3. 前端 教案模块
Write-Host "[3/5] 正在安装 教案模块依赖..." -ForegroundColor Green
cd frontend/modules/lessonplan
npm install --legacy-peer-deps
cd ../../..

# 4. 前端 资源管理模块
Write-Host "[4/5] 正在安装 资源管理模块依赖..." -ForegroundColor Green
cd frontend/modules/resource
npm install
cd ../../..

# 5. 前端 学情分析模块
Write-Host "[5/5] 正在安装 学情分析模块依赖..." -ForegroundColor Green
cd frontend/modules/wystudy_analysis
npm install
cd ../../..

Write-Host "`n所有依赖安装完成！" -ForegroundColor Yellow
Pause
