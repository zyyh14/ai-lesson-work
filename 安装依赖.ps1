# AI备课系统 - 依赖安装脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   AI备课系统 - 依赖安装脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查必需工具
Write-Host "🔍 检查必需工具..." -ForegroundColor Yellow
Write-Host ""

# 检查Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python未安装或未添加到PATH" -ForegroundColor Red
    exit
}

# 检查Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
    
    # 检查版本
    $nodeVersionNum = $nodeVersion -replace 'v', ''
    $nodeMajor = [int]($nodeVersionNum.Split('.')[0])
    if ($nodeMajor -gt 16) {
        Write-Host "   ⚠️  警告：当前Node.js版本较新，项目建议使用v16" -ForegroundColor Yellow
        Write-Host "   如遇到问题，建议使用nvm切换到Node.js 16" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Node.js未安装或未添加到PATH" -ForegroundColor Red
    exit
}

# 检查Maven
try {
    $mavenVersion = mvn --version 2>&1 | Select-Object -First 1
    Write-Host "✅ Maven: $mavenVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Maven未安装或未添加到PATH" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "开始安装依赖..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 安装Python依赖
Write-Host "1️⃣  安装Python服务依赖..." -ForegroundColor Green
Set-Location ".\python_service"
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python依赖安装失败" -ForegroundColor Red
    Set-Location ".."
    exit
}
Write-Host "✅ Python依赖安装完成" -ForegroundColor Green
Set-Location ".."
Write-Host ""

# 2. 安装PPT模块依赖
Write-Host "2️⃣  安装PPT前端模块依赖..." -ForegroundColor Green
Set-Location ".\frontend\modules\ppt"
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ PPT模块依赖安装失败" -ForegroundColor Red
    Set-Location "..\..\..\"
    exit
}
Write-Host "✅ PPT模块依赖安装完成" -ForegroundColor Green
Set-Location "..\..\..\"
Write-Host ""

# 3. 安装教案模块依赖
Write-Host "3️⃣  安装教案前端模块依赖..." -ForegroundColor Green
Set-Location ".\frontend\modules\lessonplan"
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 教案模块依赖安装失败" -ForegroundColor Red
    Set-Location "..\..\..\"
    exit
}
Write-Host "✅ 教案模块依赖安装完成" -ForegroundColor Green
Set-Location "..\..\..\"
Write-Host ""

# 4. 安装资源管理模块依赖
Write-Host "4️⃣  安装资源管理前端模块依赖..." -ForegroundColor Green
Set-Location ".\frontend\modules\resource"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 资源管理模块依赖安装失败" -ForegroundColor Red
    Set-Location "..\..\..\"
    exit
}
Write-Host "✅ 资源管理模块依赖安装完成" -ForegroundColor Green
Set-Location "..\..\..\"
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ 所有依赖安装完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 下一步操作：" -ForegroundColor Yellow
Write-Host "1. 编辑 python_service/.env 文件，填入API密钥" -ForegroundColor White
Write-Host "2. 运行 .\一键启动.ps1 启动所有服务" -ForegroundColor White
Write-Host ""

Read-Host "按Enter键退出"
