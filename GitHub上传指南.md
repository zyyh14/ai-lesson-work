# 📤 AI备课系统 - GitHub上传指南

## 📋 准备工作

### 1. 安装Git

如果还没有安装Git，请先安装：

**Windows：**
- 下载：https://git-scm.com/download/win
- 安装后重启终端

**验证安装：**
```powershell
git --version
```

### 2. 配置Git用户信息

```powershell
# 设置用户名
git config --global user.name "你的GitHub用户名"

# 设置邮箱（使用GitHub注册的邮箱）
git config --global user.email "your-email@example.com"

# 验证配置
git config --list
```

### 3. 创建GitHub账号

如果还没有GitHub账号：
1. 访问 https://github.com
2. 点击 "Sign up" 注册
3. 验证邮箱

---

## 🚀 上传步骤

### 方法1：使用命令行（推荐）

#### 步骤1：初始化Git仓库

```powershell
# 进入项目目录
cd ai-lesson-work-cjz-resources

# 初始化Git仓库
git init

# 查看状态
git status
```

#### 步骤2：添加文件到暂存区

```powershell
# 添加所有文件（.gitignore会自动排除不需要的文件）
git add .

# 查看将要提交的文件
git status
```

#### 步骤3：创建第一次提交

```powershell
# 提交文件
git commit -m "Initial commit: AI备课系统完整项目"

# 查看提交历史
git log --oneline
```

#### 步骤4：在GitHub创建远程仓库

1. 登录 https://github.com
2. 点击右上角 "+" → "New repository"
3. 填写信息：
   - **Repository name**: `ai-lesson-preparation-system`（或你喜欢的名字）
   - **Description**: `AI驱动的智能备课系统，包含教案生成、课件制作、资源管理和学情分析四大模块`
   - **Public/Private**: 选择公开或私有
   - ⚠️ **不要勾选** "Initialize this repository with a README"
4. 点击 "Create repository"

#### 步骤5：连接远程仓库并推送

```powershell
# 添加远程仓库（替换为你的GitHub用户名和仓库名）
git remote add origin https://github.com/你的用户名/ai-lesson-preparation-system.git

# 验证远程仓库
git remote -v

# 推送到GitHub（首次推送）
git push -u origin main

# 如果提示分支名是master，使用：
# git branch -M main
# git push -u origin main
```

**如果遇到认证问题：**

GitHub现在需要使用Personal Access Token（个人访问令牌）：

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 设置：
   - Note: `AI备课系统`
   - Expiration: 选择有效期
   - 勾选 `repo` 权限
4. 点击 "Generate token"
5. **复制生成的token**（只显示一次！）
6. 推送时使用token作为密码

---

### 方法2：使用GitHub Desktop（图形界面）

#### 步骤1：安装GitHub Desktop

下载：https://desktop.github.com/

#### 步骤2：登录GitHub账号

打开GitHub Desktop → File → Options → Accounts → Sign in

#### 步骤3：添加本地仓库

1. File → Add local repository
2. 选择 `ai-lesson-work-cjz-resources` 文件夹
3. 如果提示"不是Git仓库"，点击 "Create a repository"

#### 步骤4：提交更改

1. 在左侧看到所有更改的文件
2. 在底部输入提交信息：`Initial commit: AI备课系统完整项目`
3. 点击 "Commit to main"

#### 步骤5：发布到GitHub

1. 点击顶部 "Publish repository"
2. 填写仓库名称和描述
3. 选择公开或私有
4. 点击 "Publish repository"

---

## 📝 创建优秀的README

在上传之前，让我为你创建一个专业的README.md：

### 项目README内容

```markdown
# 🎓 AI智能备课系统

> 基于AI技术的一站式教师备课解决方案，集成教案生成、课件制作、资源管理和学情分析四大核心功能。

## ✨ 功能特点

### 🎯 四大核心模块

1. **智能教案生成** - AI驱动的教案设计引擎
   - 一键生成结构化教案
   - 支持自定义修改和优化
   - 多种教案模板

2. **智能课件制作** - 所见即所得的PPT编辑器
   - PPT导入和解析
   - AI辅助内容生成
   - 可视化编辑器
   - 导出为PPTX格式

3. **教学资源库** - 智能资源管理系统
   - AI智能推荐
   - 多格式素材管理
   - 资源搜索和分类

4. **学情分析中心** - 数据驱动的教学分析
   - 成绩数据可视化
   - 智能学情分析
   - 个性化学习方案
   - 补救试卷生成

## 🏗️ 技术架构

### 前端技术栈
- React 19 + TypeScript
- Vite 5/6
- React Router
- Recharts（数据可视化）
- Lucide React（图标）
- TailwindCSS

### 后端技术栈
- Spring Boot 2.7.18
- Python FastAPI
- H2 Database
- Maven

### AI集成
- 火山引擎 Ark API
- Google Gemini API
- 智谱AI

## 🚀 快速开始

### 环境要求

- Node.js 16+ (推荐 v16.20.2)
- Python 3.12+
- Java 8
- Maven 3.9+

### 安装步骤

1. **克隆项目**
   \`\`\`bash
   git clone https://github.com/你的用户名/ai-lesson-preparation-system.git
   cd ai-lesson-preparation-system
   \`\`\`

2. **配置环境变量**
   
   编辑 `python_service/.env` 文件：
   \`\`\`env
   SUPABASE_URL=你的Supabase项目URL
   SUPABASE_KEY=你的Supabase API密钥
   ZHIPU_API_KEY=你的智谱AI密钥
   \`\`\`

3. **安装依赖**
   \`\`\`powershell
   # 使用自动化脚本
   .\安装依赖.ps1
   
   # 或手动安装
   cd python_service && pip install -r requirements.txt
   cd frontend/modules/ppt && npm install --legacy-peer-deps
   cd frontend/modules/lessonplan && npm install --legacy-peer-deps
   cd frontend/modules/resource && npm install
   cd frontend/modules/wystudy_analysis && npm install
   \`\`\`

4. **启动服务**
   \`\`\`powershell
   # 使用一键启动脚本
   .\一键启动.ps1
   \`\`\`

5. **访问应用**
   - Dashboard首页: http://localhost:3001
   - 教案模块: http://localhost:3000
   - 资源管理: http://localhost:3002
   - 学情分析: http://localhost:3003

## 📖 详细文档

- [快速开始指南](快速开始.md)
- [完整启动指南](startrunning.md)
- [模块跳转配置](模块跳转配置说明.md)
- [项目运行状态报告](项目运行状态报告.md)
- [问题诊断和解决方案](问题诊断和解决方案.txt)

## 🎯 项目结构

\`\`\`
ai-lesson-work-cjz-resources/
├── backend/                    # Spring Boot后端
│   ├── src/
│   └── pom.xml
├── python_service/            # Python FastAPI服务
│   ├── app/
│   └── requirements.txt
├── frontend/
│   └── modules/
│       ├── ppt/              # PPT模块（主入口）
│       ├── lessonplan/       # 教案模块
│       ├── resource/         # 资源管理模块
│       └── wystudy_analysis/ # 学情分析模块
├── 一键启动.ps1              # 自动启动脚本
├── 安装依赖.ps1              # 依赖安装脚本
└── 环境检查.ps1              # 环境检查脚本
\`\`\`

## 🌟 功能演示

### Dashboard首页
![Dashboard](screenshots/dashboard.png)

### PPT编辑器
![PPT Editor](screenshots/ppt-editor.png)

### 学情分析
![Analysis](screenshots/analysis.png)

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 开源协议

本项目采用 MIT 协议 - 查看 [LICENSE](LICENSE) 文件了解详情

## 👥 团队成员

- 教案模块开发
- PPT模块开发
- 资源管理模块开发
- 学情分析模块开发

## 📧 联系方式

- 项目主页: https://github.com/你的用户名/ai-lesson-preparation-system
- 问题反馈: https://github.com/你的用户名/ai-lesson-preparation-system/issues

## 🙏 致谢

感谢以下开源项目：
- React
- Spring Boot
- FastAPI
- Vite
- 以及所有依赖的开源库

---

⭐ 如果这个项目对你有帮助，请给我们一个Star！
\`\`\`

---

## 🔒 安全注意事项

### 敏感信息保护

在上传前，确保以下文件已被.gitignore排除：

✅ **已排除的文件：**
- `node_modules/` - 依赖包
- `.env` 和 `.env.local` - 环境变量（包含API密钥）
- `data/*.db` - 数据库文件
- `target/` 和 `dist/` - 编译输出
- `.vscode/` 和 `.idea/` - IDE配置

⚠️ **检查清单：**

```powershell
# 检查是否有敏感信息
git status

# 查看将要提交的文件
git diff --cached

# 如果发现敏感文件，从暂存区移除
git reset HEAD 文件名
```

### 创建环境变量模板

为了让其他人能够配置项目，创建示例文件：

```powershell
# 创建 .env.example（不包含真实密钥）
cp python_service/.env python_service/.env.example

# 编辑 .env.example，将真实值替换为占位符
```

---

## 📊 后续维护

### 日常更新流程

```powershell
# 1. 查看更改
git status

# 2. 添加更改
git add .

# 3. 提交更改
git commit -m "描述你的更改"

# 4. 推送到GitHub
git push
```

### 创建新分支

```powershell
# 创建并切换到新分支
git checkout -b feature/新功能名称

# 开发完成后推送
git push -u origin feature/新功能名称

# 在GitHub上创建Pull Request
```

### 标签和版本

```powershell
# 创建版本标签
git tag -a v1.0.0 -m "第一个正式版本"

# 推送标签
git push origin v1.0.0

# 推送所有标签
git push --tags
```

---

## 🎨 可选：添加项目徽章

在README.md顶部添加徽章，让项目更专业：

```markdown
![GitHub stars](https://img.shields.io/github/stars/你的用户名/仓库名)
![GitHub forks](https://img.shields.io/github/forks/你的用户名/仓库名)
![GitHub issues](https://img.shields.io/github/issues/你的用户名/仓库名)
![License](https://img.shields.io/github/license/你的用户名/仓库名)
```

---

## 📸 添加截图

为了让README更吸引人，建议添加项目截图：

1. 创建 `screenshots` 文件夹
2. 截取各模块的界面图
3. 在README中引用

---

## ✅ 上传检查清单

上传前请确认：

- [ ] 已安装并配置Git
- [ ] 已创建GitHub账号
- [ ] 已初始化Git仓库
- [ ] 已检查.gitignore文件
- [ ] 已移除所有敏感信息
- [ ] 已创建.env.example模板
- [ ] 已编写README.md
- [ ] 已创建第一次提交
- [ ] 已在GitHub创建远程仓库
- [ ] 已成功推送代码

---

## 🆘 常见问题

### Q1: 推送时提示认证失败
**A:** 使用Personal Access Token代替密码

### Q2: 文件太大无法上传
**A:** GitHub单个文件限制100MB，使用Git LFS处理大文件

### Q3: 如何撤销提交
**A:** 
```powershell
# 撤销最后一次提交（保留更改）
git reset --soft HEAD~1

# 撤销最后一次提交（丢弃更改）
git reset --hard HEAD~1
```

### Q4: 如何删除远程分支
**A:**
```powershell
git push origin --delete 分支名
```

---

## 🎉 完成！

按照以上步骤，你的项目就成功上传到GitHub了！

**下一步：**
1. 在GitHub上完善项目描述
2. 添加Topics标签（如：ai, education, react, typescript）
3. 邀请团队成员协作
4. 设置GitHub Pages展示项目

---

**祝你的项目获得更多Star！** ⭐
