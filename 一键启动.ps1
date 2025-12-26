# AI备课系统 - 一键启动脚本
# 此脚本会在多个窗口中启动所有服务

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   AI备课系统 - 自动启动脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查.env文件是否配置
$envFile = ".\python_service\.env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "your_supabase_url_here" -or $envContent -match "your_zhipu_api_key_here") {
        Write-Host "⚠️  警告：检测到 python_service/.env 文件未配置" -ForegroundColor Yellow
        Write-Host "   请先编辑该文件，填入真实的API密钥：" -ForegroundColor Yellow
        Write-Host "   - SUPABASE_URL" -ForegroundColor Yellow
        Write-Host "   - SUPABASE_KEY" -ForegroundColor Yellow
        Write-Host "   - ZHIPU_API_KEY" -ForegroundColor Yellow
        Write-Host ""
        $continue = Read-Host "是否继续启动？(y/n)"
        if ($continue -ne "y") {
            exit
        }
    }
} else {
    Write-Host "❌ 错误：找不到 python_service/.env 文件" -ForegroundColor Red
    Write-Host "   请先运行配置脚本或手动创建该文件" -ForegroundColor Red
    exit
}

Write-Host "🚀 开始启动服务..." -ForegroundColor Green
Write-Host ""

# 1. 启动Python服务
Write-Host "1️⃣  启动Python服务 (端口5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\python_service'; Write-Host '启动Python服务...' -ForegroundColor Cyan; python start.py"
Start-Sleep -Seconds 3

# 2. 启动Spring Boot服务
Write-Host "2️⃣  启动Spring Boot服务 (端口8081)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host '启动Spring Boot服务...' -ForegroundColor Cyan; mvn spring-boot:run"
Start-Sleep -Seconds 5

# 3. 启动PPT前端模块
Write-Host "3️⃣  启动PPT前端模块 (端口3001)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend\modules\ppt'; Write-Host '启动PPT模块...' -ForegroundColor Cyan; npm run dev"
Start-Sleep -Seconds 2

# 4. 启动教案前端模块
Write-Host "4️⃣  启动教案前端模块 (端口3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend\modules\lessonplan'; Write-Host '启动教案模块...' -ForegroundColor Cyan; npm run dev"
Start-Sleep -Seconds 2

# 5. 启动资源管理前端模块
Write-Host "5️⃣  启动资源管理前端模块 (端口3002)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend\modules\resource'; Write-Host '启动资源管理模块...' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ 所有服务启动命令已执行！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "请等待各服务完全启动（约30-60秒），然后访问：" -ForegroundColor Yellow
Write-Host ""
Write-Host "  📊 Python API文档:  http://localhost:5000/docs" -ForegroundColor White
Write-Host "  🔧 Spring Boot后端: http://localhost:8081" -ForegroundColor White
Write-Host "  📽️  PPT模块:        http://localhost:3001" -ForegroundColor White
Write-Host "  📝 教案模块:        http://localhost:3000" -ForegroundColor White
Write-Host "  📚 资源管理模块:    http://localhost:3002" -ForegroundColor White
Write-Host ""
Write-Host "提示：关闭此窗口不会停止服务，请手动关闭各服务窗口" -ForegroundColor Gray
Write-Host ""

# 等待用户按键
Read-Host "按Enter键退出此窗口"
