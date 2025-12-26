
# 项目功能

- **PPT 导入转 Markdown**  
  - 后端：`AdvancedPptImportService` 解析 PPTX（含表格、图片占位、备注），按页输出 Markdown，并容错单页失败。备注用 `<!-- notes ... -->` 存储。
  - 前端导入：`importPptxToMarkdown`（`services/importService`）将文件交给后端，导入后写入课件。

- **AI 生成/编辑课件 & 演讲者备注**  
  - 服务入口：`sendMessageToAI` → `geminiService`。  
  - 系统提示 `SYSTEM_INSTRUCTION` 定义 Markdown 协议，要求为需要的页面生成中文演讲者备注，格式 `<!-- Note: ... -->`。  
  - Markdown 与内部数据互转：`presentationSync.ts`（读取/生成备注、内容、图片、mermaid）。
  - 可视化编辑备注：`components/VisualEditor` 底部“演讲者备注”面板；导出 PPT 时 `pptGenerator.ts` 将 `notes` 写入 PPT 备注。

- **课件存储与同步（含并发冲突处理）**  
  - 后端接口：`LessonController`（创建、获取、同步、重命名、删除、聊天记录）。  
  - 版本冲突：`/lessons/{id}/sync` 若版本不一致返回 `409 CONFLICT`。  
  - 前端同步：`lessonService.syncLesson` 遇 409 抛出，UI 标记 `conflict`；有离线兜底，会写 localStorage。

- **导出 PPT**  
  - `utils/pptGenerator.ts` 将 Markdown 转为 PPTX，支持标题、列表、图片、Mermaid 图、演讲者备注。

# 技术栈
- 前端：React + TypeScript，fetch 调用后端，localStorage 离线兜底。
- 后端：Spring（Tomcat 9 / JDK 8 兼容），Apache POI 处理 PPTX。
- AI：Gemini 接口（流式/非流式），模型提示在 `services/geminiService.ts`。

# 本地运行
1. 安装依赖：`npm install`
2. 配置环境：`.env.local` 设置 `GEMINI_API_KEY`
3. 启动：`npm run dev`
