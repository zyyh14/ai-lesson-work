# Python 教学资源管理服务

## 环境变量配置

### 方式一：使用 .env 文件（推荐）

1. **复制环境变量模板**：
   ```bash
   copy .env.example .env
   ```

2. **编辑 .env 文件**，填入你的实际配置值：
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   ZHIPU_API_KEY=your_zhipu_api_key
   TAVILY_API_KEY=your_tavily_api_key
   ```

3. **启动服务**，环境变量会自动从 .env 文件加载：
   ```bash
   python start.py
   ```

### 方式二：在 PowerShell 中设置环境变量

每次启动前需要设置：
```powershell
$env:SUPABASE_URL="your_supabase_url"
$env:SUPABASE_KEY="your_supabase_key"
$env:ZHIPU_API_KEY="your_zhipu_api_key"
$env:TAVILY_API_KEY="your_tavily_api_key"
```

## 快速开始

### 1. 创建虚拟环境

```bash
python -m venv venv
.\venv\Scripts\activate
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置环境变量

使用方式一（.env 文件）或方式二（PowerShell 环境变量）

### 4. 启动服务

```bash
python start.py
```

服务将在 `http://localhost:5000` 启动

### 5. 访问 API 文档

- Swagger UI: http://localhost:5000/docs
- ReDoc: http://localhost:5000/redoc

## 注意事项

- `.env` 文件包含敏感信息，已被 `.gitignore` 忽略，不会提交到 Git
- 如果使用 `.env` 文件，每次启动服务时会自动读取，无需手动设置环境变量
- 如果使用 PowerShell 环境变量，每次新开终端都需要重新设置

