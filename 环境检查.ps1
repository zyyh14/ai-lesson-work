# AI备课系统 - 环境检查脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   AI备课系统 - 环境检查" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# 1. 检查Python
Write-Host "🔍 检查Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "  ✅ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Python未安装或未添加到PATH" -ForegroundColor Red
    $allGood = $false
}

# 2. 检查Node.js
Write-Host "🔍 检查Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>&1
    Write-Host "  ✅ Node.js $nodeVersion" -ForegroundColor Green
    
    $nodeVersionNum = $nodeVersion -replace 'v', ''
    $nodeMajor = [int]($nodeVersionNum.Split('.')[0])
    if ($nodeMajor -ne 16) {
        Write-Host "  ⚠️  建议版本: v16.x (当前: $nodeVersion)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Node.js未安装或未添加到PATH" -ForegroundColor Red
    $allGood = $false
}

# 3. 检查npm
Write-Host "🔍 检查npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version 2>&1
    Write-Host "  ✅ npm $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ npm未安装或未添加到PATH" -ForegroundColor Red
    $allGood = $false
}

# 4. 检查Maven
Write-Host "🔍 检查Maven..." -ForegroundColor Yellow
try {
    $mavenVersion = mvn --version 2>&1 | Select-Object -First 1
    Write-Host "  ✅ $mavenVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Maven未安装或未添加到PATH" -ForegroundColor Red
    $allGood = $false
}

# 5. 检查Java
Write-Host "🔍 检查Java..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    Write-Host "  ✅ $javaVersion" -ForegroundColor Green
    
    if ($javaVersion -notmatch "1\.8" -and $javaVersion -notmatch '"8"') {
        Write-Host "  ⚠️  建议版本: Java 8 (当前可能不是)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Java未安装或未添加到PATH" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   配置文件检查" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 6. 检查Python .env文件
Write-Host "🔍 检查Python服务配置..." -ForegroundColor Yellow
$envFile = ".\python_service\.env"
if (Test-Path $envFile) {
    Write-Host "  ✅ .env文件存在" -ForegroundColor Green
    
    $envContent = Get-Content $envFile -Raw
    
    # 检查必需的配置项
    $requiredKeys = @("SUPABASE_URL", "SUPABASE_KEY", "ZHIPU_API_KEY")
    foreach ($key in $requiredKeys) {
        if ($envContent -match "$key=\s*$" -or $envContent -match "$key=your_") {
            Write-Host "  ⚠️  $key 未配置" -ForegroundColor Yellow
            $allGood = $false
        } else {
            Write-Host "  ✅ $key 已配置" -ForegroundColor Green
        }
    }
} else {
    Write-Host "  ❌ .env文件不存在" -ForegroundColor Red
    $allGood = $false
}

# 7. 检查Spring Boot配置
Write-Host "🔍 检查Spring Boot配置..." -ForegroundColor Yellow
$appProps = ".\backend\src\main\resources\application.properties"
if (Test-Path $appProps) {
    Write-Host "  ✅ application.properties存在" -ForegroundColor Green
} else {
    Write-Host "  ❌ application.properties不存在" -ForegroundColor Red
    $allGood = $false
}

# 8. 检查前端配置
Write-Host "🔍 检查前端配置..." -ForegroundColor Yellow
$pptEnv = ".\frontend\modules\ppt\.env.local"
if (Test-Path $pptEnv) {
    Write-Host "  ✅ PPT模块 .env.local存在" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  PPT模块 .env.local不存在（可选）" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   依赖检查" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 9. 检查Python依赖
Write-Host "🔍 检查Python依赖..." -ForegroundColor Yellow
if (Test-Path ".\python_service\requirements.txt") {
    try {
        $pipList = pip list 2>&1
        $requiredPackages = @("fastapi", "uvicorn", "langchain")
        $missingPackages = @()
        
        foreach ($pkg in $requiredPackages) {
            if ($pipList -notmatch $pkg) {
                $missingPackages += $pkg
            }
        }
        
        if ($missingPackages.Count -eq 0) {
            Write-Host "  ✅ Python依赖已安装" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  缺少依赖: $($missingPackages -join ', ')" -ForegroundColor Yellow
            Write-Host "     运行: pip install -r python_service\requirements.txt" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  ⚠️  无法检查Python依赖" -ForegroundColor Yellow
    }
}

# 10. 检查前端依赖
Write-Host "🔍 检查前端依赖..." -ForegroundColor Yellow
$frontendModules = @(
    @{Name="PPT模块"; Path=".\frontend\modules\ppt"},
    @{Name="教案模块"; Path=".\frontend\modules\lessonplan"},
    @{Name="资源管理模块"; Path=".\frontend\modules\resource"}
)

foreach ($module in $frontendModules) {
    if (Test-Path "$($module.Path)\node_modules") {
        Write-Host "  ✅ $($module.Name) 依赖已安装" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  $($module.Name) 依赖未安装" -ForegroundColor Yellow
        Write-Host "     运行: cd $($module.Path); npm install --legacy-peer-deps" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   端口检查" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 11. 检查端口占用
Write-Host "🔍 检查端口占用..." -ForegroundColor Yellow
$ports = @(5000, 8081, 3000, 3001, 3002)
$portsInUse = @()

foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $portsInUse += $port
        Write-Host "  ⚠️  端口 $port 已被占用" -ForegroundColor Yellow
    } else {
        Write-Host "  ✅ 端口 $port 可用" -ForegroundColor Green
    }
}

if ($portsInUse.Count -gt 0) {
    Write-Host ""
    Write-Host "  提示: 如需释放端口，运行:" -ForegroundColor Gray
    Write-Host "  netstat -ano | findstr :<端口号>" -ForegroundColor Gray
    Write-Host "  taskkill /PID <进程ID> /F" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   检查结果" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($allGood) {
    Write-Host "✅ 环境检查通过！可以开始安装依赖和启动服务。" -ForegroundColor Green
    Write-Host ""
    Write-Host "下一步操作：" -ForegroundColor Yellow
    Write-Host "1. 如果依赖未安装，运行: .\安装依赖.ps1" -ForegroundColor White
    Write-Host "2. 确保配置了 python_service\.env 文件" -ForegroundColor White
    Write-Host "3. 运行: .\一键启动.ps1" -ForegroundColor White
} else {
    Write-Host "⚠️  发现一些问题，请根据上述提示进行修复。" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "常见解决方案：" -ForegroundColor Yellow
    Write-Host "- 配置 python_service\.env 文件中的API密钥" -ForegroundColor White
    Write-Host "- 安装缺失的依赖: .\安装依赖.ps1" -ForegroundColor White
    Write-Host "- 释放被占用的端口" -ForegroundColor White
}

Write-Host ""
Read-Host "按Enter键退出"
