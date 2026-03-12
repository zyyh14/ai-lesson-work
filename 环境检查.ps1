# 环境检查脚本
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "          AI智能备课系统 - 环境检查脚本" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. 检查 Node.js
try {
    $nodeVersion = node -v
    Write-Host "[OK] Node.js 已安装: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[Error] Node.js 未安装，请前往 https://nodejs.org/ 下载安装 (推荐 v18+)" -ForegroundColor Red
}

# 2. 检查 Python
try {
    $pythonVersion = python --version
    Write-Host "[OK] Python 已安装: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[Error] Python 未安装，请前往 https://www.python.org/ 下载安装 (推荐 3.9+)" -ForegroundColor Red
}

# 3. 检查 Java
try {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    Write-Host "[OK] Java 已安装: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "[Error] Java 未安装，请安装 JDK 8 或更高版本" -ForegroundColor Red
}

# 4. 检查 Maven
try {
    $mvnVersion = mvn -v | Select-Object -First 1
    Write-Host "[OK] Maven 已安装: $mvnVersion" -ForegroundColor Green
} catch {
    Write-Host "[Error] Maven 未安装，请前往 https://maven.apache.org/ 下载安装" -ForegroundColor Red
}

Write-Host "`n检查完成！" -ForegroundColor Yellow
Pause
