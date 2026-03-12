# 🎓 AI智能备课系统

> 基于AI技术的一站式教师备课解决方案，集成教案生成、课件制作、资源管理和学情分析四大核心功能。

[![GitHub stars](https://img.shields.io/github/stars/zyh14/ai-lesson-work?style=social)](https://github.com/zyh14/ai-lesson-work)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ 功能特点

### 🎯 四大核心模块

| 模块 | 功能描述 | 端口 |
|------|---------|------|
| **智能教案生成** | AI驱动的教案设计引擎，支持一键生成与自定义修改 | 3000 |
| **智能课件制作** | 所见即所得的PPT编辑器，支持导入、编辑和导出 | 3001 |
| **教学资源库** | 智能推荐分层资源，支持多格式素材管理 | 3002 |
| **学情分析中心** | 多维度数据可视化，精准定位学生薄弱点 | 3003 |

### 🚀 核心功能

#### 📝 智能教案生成
- ✅ AI一键生成结构化教案
- ✅ 多种教案模板选择
- ✅ 支持自定义修改和优化
- ✅ 教学目标智能规划

#### 📊 智能课件制作
- ✅ PPT文件导入和解析
- ✅ AI辅助内容生成
- ✅ 可视化编辑器
- ✅ 演讲者备注管理
- ✅ 导出为PPTX格式
- ✅ Markdown与PPT互转

#### 📚 教学资源库
- ✅ AI智能资源推荐
- ✅ 多格式素材管理
- ✅ 资源搜索和分类
- ✅ 收藏管理功能

#### 📈 学情分析中心
- ✅ 成绩数据导入（Excel/图片）
- ✅ 智能学情分析
- ✅ 数据可视化图表
- ✅ 个性化学习方案
- ✅ 补救试卷生成

## 🏗️ 技术架构

### 前端技术栈
```
React 19 + TypeScript
├── Vite 5/6 - 构建工具
├── React Router - 路由管理
├── Recharts - 数据可视化
├── Lucide React - 图标库
└── TailwindCSS - 样式框架
```

### 后端技术栈
```
微服务架构
├── Spring Boot 2.7.18 - 主后端服务
├── Python FastAPI - AI资源服务
├── H2 Database - 嵌入式数据库
└── Maven - 项目管理
```

### AI集成
- 🔥 火山引擎 Ark API (DeepSeek, Doubao)
- 🤖 Google Gemini API
- 🧠 智谱AI (GLM-4)

## 🚀 快速开始

### 环境要求

| 工具 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | 18+ | 推荐 v18.x 或更高 |
| Python | 3.9+ | 用于AI服务 |
| Java | 8 | Spring Boot需要 |
| Maven | 3.9+ | 项目构建 |

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/zyh14/ai-lesson-work.git
cd ai-lesson-work
```

#### 2. 配置环境变量

复制环境变量模板并填写真实值：

```bash
# Python服务配置
cp python_service/.env.example python_service/.env
# 编辑 python_service/.env，填入 ZHIPU_API_KEY, TAVILY_API_KEY 等
```

#### 3. 安装依赖

**Windows (PowerShell):**
```powershell
# 使用自动化脚本（推荐）
.\安装依赖.ps1
```

**手动安装:**
```bash
# Python依赖
cd python_service
pip install -r requirements.txt

# 前端依赖
cd frontend/modules/ppt
npm install

cd ../lessonplan
npm install

cd ../resource
npm install

cd ../wystudy_analysis
npm install
```

#### 4. 启动服务

**Windows (PowerShell):**
```powershell
# 使用一键启动脚本（推荐）
.\一键启动.ps1
```

**或者使用批处理脚本:**
```powershell
.\start_all.bat
```

## 🎯 项目结构

```
ai-lesson-work/
├── backend/                    # Spring Boot后端
├── python_service/            # Python FastAPI服务
├── frontend/
│   └── modules/
│       ├── ppt/              # PPT模块（主入口）
│       ├── lessonplan/       # 教案模块
│       ├── resource/         # 资源管理模块
│       └── wystudy_analysis/ # 学情分析模块
├── start_all.bat             # Windows 批处理启动脚本
├── 一键启动.ps1              # PowerShell 自动启动脚本
├── 安装依赖.ps1              # PowerShell 依赖安装脚本
├── 环境检查.ps1              # PowerShell 环境检查脚本
└── README.md                # 项目说明
```
##  账号信息

### 管理员账号
- **访问地址**: http://localhost:3001/admin/login
- **用户名**: `admin` 
- **密码**: `admin123` 
- **权限**: 管理员权限，可以访问后台管理系统
#### 管理员功能
访问 http://localhost:3001/admin 可以管理：
- 用户管理
- AI模型配置
- 用户反馈
- 审计日志

---

### 教师测试账号

系统预置了多个教师测试账号，可以直接使用：

#### 账号1
- **用户名**: `teacher` 
- **密码**: `123456` 
- **权限**: 教师权限

#### 账号2
- **用户名**: `teacher1` 
- **密码**: `123456` 
- **权限**: 教师权限

#### 账号3
- **用户名**: `teacher2` 
- **密码**: `123456` 
- **权限**: 教师权限


---

### 账号数据存储

#### 数据库位置
- **类型**: H2嵌入式数据库
- **位置**: `backend/data/teacherai_fresh.mv.db` 
- **访问**: http://localhost:8081/h2-console

---

### 账号初始化

系统启动时会自动初始化以下账号（如果不存在）：

#### 代码位置
`backend/src/main/java/com/example/demo/modules/admin/config/AdminDataSeeder.java` 

---

### 安全提示

⚠️ **重要提示**：

**生产环境请修改默认密码**
   - 管理员密码 `admin123` 仅用于开发测试
   - 教师密码 `123456` 仅用于开发测试


---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个Star！**

Made with ❤️ by zjut AI备课系统团队

</div>
