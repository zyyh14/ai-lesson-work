# 🎓 AI智能备课系统

> 基于AI技术的一站式教师备课解决方案，集成教案生成、课件制作、资源管理和学情分析四大核心功能。

[![GitHub stars](https://img.shields.io/github/stars/你的用户名/ai-lesson-preparation-system?style=social)](https://github.com/你的用户名/ai-lesson-preparation-system)
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
- 🔥 火山引擎 Ark API
- 🤖 Google Gemini API
- 🧠 智谱AI

## 🚀 快速开始

### 环境要求

| 工具 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | 16+ | 推荐 v16.20.2 |
| Python | 3.12+ | 用于AI服务 |
| Java | 8 | Spring Boot需要 |
| Maven | 3.9+ | 项目构建 |

### 安装步骤

#### 1. 克隆项目

```bash
git clone https://github.com/你的用户名/ai-lesson-preparation-system.git
cd ai-lesson-preparation-system
```

#### 2. 配置环境变量

复制环境变量模板并填写真实值：

```bash
# Python服务配置
cp python_service/.env.example python_service/.env
# 编辑 python_service/.env，填入API密钥
```

必需配置项：
- `SUPABASE_URL` - Supabase项目URL
- `SUPABASE_KEY` - Supabase API密钥
- `ZHIPU_API_KEY` - 智谱AI密钥

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
npm install --legacy-peer-deps

cd ../lessonplan
npm install --legacy-peer-deps

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

**手动启动（需要5个终端窗口）:**
```bash
# 窗口1: Python服务
cd python_service
python start.py

# 窗口2: Spring Boot服务
cd backend
mvn spring-boot:run

# 窗口3: PPT模块
cd frontend/modules/ppt
npm run dev

# 窗口4: 教案模块
cd frontend/modules/lessonplan
npm run dev

# 窗口5: 资源管理模块
cd frontend/modules/resource
npm run dev

# 窗口6: 学情分析模块
cd frontend/modules/wystudy_analysis
npm run dev
```

#### 5. 访问应用

| 模块 | 访问地址 |
|------|---------|
| **Dashboard首页** | http://localhost:3001 |
| **教案模块** | http://localhost:3000 |
| **资源管理** | http://localhost:3002 |
| **学情分析** | http://localhost:3003 |
| **Python API文档** | http://localhost:5000/docs |
| **Spring Boot后端** | http://localhost:8081 |

## 📖 详细文档

- 📘 [快速开始指南](快速开始.md) - 三步启动项目
- 📗 [完整启动指南](startrunning.md) - 详细的启动说明
- 📙 [模块跳转配置](模块跳转配置说明.md) - 模块间跳转逻辑
- 📕 [项目运行状态报告](项目运行状态报告.md) - 完整的状态信息
- 📔 [问题诊断和解决方案](问题诊断和解决方案.txt) - 常见问题FAQ

## 🎯 项目结构

```
ai-lesson-work-cjz-resources/
├── backend/                    # Spring Boot后端
│   ├── src/
│   │   └── main/
│   │       ├── java/          # Java源代码
│   │       └── resources/     # 配置文件
│   ├── data/                  # H2数据库文件
│   └── pom.xml               # Maven配置
│
├── python_service/            # Python FastAPI服务
│   ├── app/
│   │   ├── core/             # 核心配置
│   │   ├── models/           # 数据模型
│   │   ├── routers/          # API路由
│   │   └── services/         # 业务逻辑
│   ├── requirements.txt      # Python依赖
│   └── start.py             # 启动脚本
│
├── frontend/
│   └── modules/
│       ├── ppt/              # PPT模块（主入口）
│       │   ├── components/   # React组件
│       │   ├── pages/        # 页面
│       │   ├── services/     # API服务
│       │   └── utils/        # 工具函数
│       │
│       ├── lessonplan/       # 教案模块
│       ├── resource/         # 资源管理模块
│       └── wystudy_analysis/ # 学情分析模块
│
├── 一键启动.ps1              # 自动启动脚本
├── 安装依赖.ps1              # 依赖安装脚本
├── 环境检查.ps1              # 环境检查脚本
└── README.md                # 项目说明
```

## 🌟 功能演示

### Dashboard首页
从统一的Dashboard可以快速访问所有模块，提供直观的工作台界面。

### PPT编辑器
支持PPT导入、AI生成内容、可视化编辑和导出功能。

### 学情分析
通过图表直观展示学生成绩分布、薄弱知识点，并生成个性化学习方案。

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 使用TypeScript编写前端代码
- 遵循ESLint规则
- 提交前运行测试
- 编写清晰的提交信息

## 🐛 问题反馈

如果遇到问题，请：

1. 查看 [问题诊断和解决方案](问题诊断和解决方案.txt)
2. 搜索 [Issues](https://github.com/你的用户名/ai-lesson-preparation-system/issues)
3. 创建新的Issue，提供详细信息

## 📄 开源协议

本项目采用 MIT 协议 - 查看 [LICENSE](LICENSE) 文件了解详情

## 👥 团队成员

本项目由以下成员共同开发：

- **教案模块** - 负责AI教案生成功能
- **PPT模块** - 负责课件制作和编辑
- **资源管理模块** - 负责教学资源库
- **学情分析模块** - 负责数据分析和可视化

## 📧 联系方式

- 项目主页: https://github.com/你的用户名/ai-lesson-preparation-system
- 问题反馈: https://github.com/你的用户名/ai-lesson-preparation-system/issues
- 邮箱: your-email@example.com

## 🙏 致谢

感谢以下开源项目和服务：

- [React](https://reactjs.org/) - 前端框架
- [Spring Boot](https://spring.io/projects/spring-boot) - 后端框架
- [FastAPI](https://fastapi.tiangolo.com/) - Python Web框架
- [Vite](https://vitejs.dev/) - 构建工具
- [Recharts](https://recharts.org/) - 图表库
- [Lucide](https://lucide.dev/) - 图标库
- 火山引擎、Google Gemini、智谱AI - AI服务支持

## 📊 项目统计

- 🎯 4个核心功能模块
- 🚀 6个独立服务
- 💻 前后端分离架构
- 🤖 多AI模型集成
- 📱 响应式设计

## 🔮 未来规划

- [ ] 移动端适配
- [ ] 用户认证系统
- [ ] 多人协作功能
- [ ] 云端数据同步
- [ ] 更多AI模型支持
- [ ] 插件系统

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给我们一个Star！**

Made with ❤️ by AI备课系统团队

</div>
