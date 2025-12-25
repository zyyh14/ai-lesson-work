# AI 教师备课系统 - 前端

> 基于 React + TypeScript + Vite 构建的智能教师备课助手

## 🎯 项目简介

这是一个 AI 驱动的教师备课系统前端应用，帮助教师快速获取教学资源和生成练习题。

### 核心功能

- 🔍 **智能资源搜索** - AI 搜索并整理网络教学资源
- ✏️ **练习题生成** - 自动生成选择题、填空题、简答题
- ⭐ **资源收藏** - 管理个人教学资源库

## 🚀 快速开始

### 前置要求

- Node.js 16+ （推荐 18+ LTS）
- npm 或 yarn
- 后端服务运行在 http://localhost:8000

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

前端将运行在：http://localhost:3000

### 构建生产版本

```bash
npm run build
npm run preview
```

## 📁 项目结构

```
.
├── index.html              # HTML 入口
├── index.tsx               # React 主应用
├── src/
│   └── services/
│       └── api.ts          # API 服务层
├── package.json            # 项目依赖
├── vite.config.ts          # Vite 配置
├── .env.local              # 环境变量
├── API接口文档.md          # API 文档
├── 前端使用说明.md         # 详细使用说明
├── 启动指南.md             # 快速启动指南
├── 项目总结.md             # 项目总结
└── test-api.html           # API 测试工具
```

## 🔧 技术栈

- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite 4** - 构建工具
- **Tailwind CSS** - 样式框架
- **Font Awesome** - 图标库

## 📡 API 接口

### 搜索教学资源

```typescript
GET /api/v1/resources/search?query=静夜思&limit=5
```

### 生成练习题

```typescript
POST /api/v1/exercises/generate
{
  "knowledge_point": "初中水平 - 李白《静夜思》"
}
```

详细 API 文档请查看：[API接口文档.md](./API接口文档.md)

## 🎨 功能特性

### 1. 推荐资源
- 输入教学主题
- AI 搜索并整理资源（20-40秒）
- 查看完整教学报告
- 收藏喜欢的资源

### 2. 习题实验室
- 输入知识点和难度
- AI 生成练习题（5-15秒）
- 包含答案和解析
- 保存到收藏库

### 3. 资源收藏
- 管理收藏的资源
- 查看保存的练习题
- 个人教学资源库

## 🐛 常见问题

### 网络连接失败

**错误**: "网络连接失败，请检查后端服务是否启动"

**解决方案**:
1. 确保后端运行在 http://localhost:8000
2. 访问 http://localhost:8000/health 检查状态
3. 查看后端日志

### 搜索资源超时

**原因**: 资源搜索需要 20-40 秒

**解决方案**: 耐心等待，查看加载提示

详细问题解决请查看：[前端使用说明.md](./前端使用说明.md)

## 📚 文档

- [API接口文档.md](./API接口文档.md) - 后端 API 详细说明
- [前端使用说明.md](./前端使用说明.md) - 前端功能详细说明
- [启动指南.md](./启动指南.md) - 快速启动指南
- [项目总结.md](./项目总结.md) - 项目完成总结
- [test-api.html](./test-api.html) - API 测试工具

## 🔑 环境变量

`.env.local` 包含后端所需的 API 密钥（由后端使用）：

```env
SUPABASE_URL=...
SUPABASE_KEY=...
ZHIPU_API_KEY=...
TAVILY_API_KEY=...
```

## 🎯 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 📊 项目状态

✅ **前端已完成并成功启动**

- 前端地址: http://localhost:3000
- 后端地址: http://localhost:8000 （需要单独启动）
- API 文档: http://localhost:8000/docs

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**最后更新**: 2025-12-21  
**版本**: v1.0.0  
**状态**: ✅ 运行中
