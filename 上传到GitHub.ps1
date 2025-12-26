# AI备课系统 - GitHub上传脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   AI备课系统 - GitHub上传助手" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查Git是否安装
try {
    $gitVersion = git --version 2>&1
    Write-Host "✅ Git已安装: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ 错误：未检测到Git" -ForegroundColor Red
    Write-Host "   请先安装Git: https://git-scm.com/download/win" -ForegroundColor Yellow
    Read-Host "按Enter键退出"
    exit
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   步骤1: 检查Git配置" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查Git用户配置
$userName = git config user.name 2>&1
$userEmail = git config user.email 2>&1

if ([string]::IsNullOrWhiteSpace($userName) -or [string]::IsNullOrWhiteSpace($userEmail)) {
    Write-Host "⚠️  Git用户信息未配置" -ForegroundColor Yellow
    Write-Host ""
    
    $configNow = Read-Host "是否现在配置？(y/n)"
    if ($configNow -eq "y") {
        $newUserName = Read-Host "请输入你的GitHub用户名"
        $newUserEmail = Read-Host "请输入你的GitHub邮箱"
        
        git config --global user.name "$newUserName"
        git config --global user.email "$newUserEmail"
        
        Write-Host "✅ Git配置完成" -ForegroundColor Green
    } else {
        Write-Host "请手动配置Git:" -ForegroundColor Yellow
        Write-Host "  git config --global user.name `"你的用户名`"" -ForegroundColor Gray
        Write-Host "  git config --global user.email `"your-email@example.com`"" -ForegroundColor Gray
        Read-Host "按Enter键退出"
        exit
    }
} else {
    Write-Host "✅ Git用户: $userName" -ForegroundColor Green
    Write-Host "✅ Git邮箱: $userEmail" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   步骤2: 初始化Git仓库" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查是否已经是Git仓库
if (Test-Path ".git") {
    Write-Host "✅ 已经是Git仓库" -ForegroundColor Green
} else {
    Write-Host "初始化Git仓库..." -ForegroundColor Yellow
    git init
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Git仓库初始化成功" -ForegroundColor Green
    } else {
        Write-Host "❌ Git仓库初始化失败" -ForegroundColor Red
        Read-Host "按Enter键退出"
        exit
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   步骤3: 检查敏感文件" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查.env文件
$envFiles = Get-ChildItem -Path . -Filter ".env" -Recurse -File -ErrorAction SilentlyContinue
if ($envFiles.Count -gt 0) {
    Write-Host "⚠️  发现 .env 文件:" -ForegroundColor Yellow
    foreach ($file in $envFiles) {
        Write-Host "   $($file.FullName)" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "✅ 这些文件已在 .gitignore 中排除" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   步骤4: 添加文件到Git" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "添加所有文件..." -ForegroundColor Yellow
git add .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 文件添加成功" -ForegroundColor Green
    
    # 显示将要提交的文件数量
    $stagedFiles = git diff --cached --name-only
    $fileCount = ($stagedFiles | Measure-Object).Count
    Write-Host "   将提交 $fileCount 个文件" -ForegroundColor Gray
} else {
    Write-Host "❌ 文件添加失败" -ForegroundColor Red
    Read-Host "按Enter键退出"
    exit
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   步骤5: 创建提交" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$commitMessage = Read-Host "请输入提交信息（直接按Enter使用默认信息）"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Initial commit: AI备课系统完整项目"
}

Write-Host "创建提交: $commitMessage" -ForegroundColor Yellow
git commit -m "$commitMessage"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 提交创建成功" -ForegroundColor Green
} else {
    Write-Host "❌ 提交创建失败" -ForegroundColor Red
    Read-Host "按Enter键退出"
    exit
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   步骤6: 连接GitHub仓库" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "请先在GitHub上创建仓库:" -ForegroundColor Yellow
Write-Host "1. 访问 https://github.com/new" -ForegroundColor White
Write-Host "2. 填写仓库名称（如：ai-lesson-preparation-system）" -ForegroundColor White
Write-Host "3. 选择公开或私有" -ForegroundColor White
Write-Host "4. 不要勾选 'Initialize this repository with a README'" -ForegroundColor White
Write-Host "5. 点击 'Create repository'" -ForegroundColor White
Write-Host ""

$repoUrl = Read-Host "请输入GitHub仓库URL（如：https://github.com/username/repo.git）"

if ([string]::IsNullOrWhiteSpace($repoUrl)) {
    Write-Host "❌ 未输入仓库URL" -ForegroundColor Red
    Read-Host "按Enter键退出"
    exit
}

# 检查是否已有remote
$existingRemote = git remote get-url origin 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  已存在远程仓库: $existingRemote" -ForegroundColor Yellow
    $updateRemote = Read-Host "是否更新为新的URL？(y/n)"
    if ($updateRemote -eq "y") {
        git remote set-url origin $repoUrl
        Write-Host "✅ 远程仓库URL已更新" -ForegroundColor Green
    }
} else {
    git remote add origin $repoUrl
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 远程仓库添加成功" -ForegroundColor Green
    } else {
        Write-Host "❌ 远程仓库添加失败" -ForegroundColor Red
        Read-Host "按Enter键退出"
        exit
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   步骤7: 推送到GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "准备推送到GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  注意：GitHub现在需要使用Personal Access Token" -ForegroundColor Yellow
Write-Host "   如果提示输入密码，请使用Token而不是GitHub密码" -ForegroundColor Yellow
Write-Host "   获取Token: https://github.com/settings/tokens" -ForegroundColor Yellow
Write-Host ""

$readyToPush = Read-Host "准备好推送了吗？(y/n)"
if ($readyToPush -ne "y") {
    Write-Host "已取消推送" -ForegroundColor Yellow
    Read-Host "按Enter键退出"
    exit
}

# 确保分支名为main
git branch -M main

# 推送到GitHub
Write-Host "正在推送..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   ✅ 上传成功！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "你的项目已成功上传到GitHub！" -ForegroundColor Green
    Write-Host ""
    Write-Host "下一步：" -ForegroundColor Yellow
    Write-Host "1. 访问你的GitHub仓库查看项目" -ForegroundColor White
    Write-Host "2. 编辑仓库描述和Topics" -ForegroundColor White
    Write-Host "3. 将 README_GITHUB.md 重命名为 README.md" -ForegroundColor White
    Write-Host "4. 添加项目截图到 screenshots 文件夹" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ 推送失败" -ForegroundColor Red
    Write-Host ""
    Write-Host "可能的原因：" -ForegroundColor Yellow
    Write-Host "1. 认证失败 - 需要使用Personal Access Token" -ForegroundColor White
    Write-Host "2. 网络问题 - 检查网络连接" -ForegroundColor White
    Write-Host "3. 仓库不存在 - 确认已在GitHub创建仓库" -ForegroundColor White
    Write-Host ""
    Write-Host "请查看错误信息并重试" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "按Enter键退出"
