# AI 备课系统 - 完整启动指南

## 📋 系统架构

本系统包含以下服务：
- **Python 后端服务**（FastAPI）：端口 5000
- **Spring Boot 后端服务**：端口 8081
- **PPT 前端模块**：端口 3001
- **教案前端模块**：端口 3000
- **资源管理前端模块**：端口 3002

## 🚀 启动顺序

### 第一步：启动 Python 后端服务（教学资源管理）

```powershell
# 进入 Python 服务目录
cd python_service

# 配置环境变量（在 python_service 目录下创建 .env 文件或使用以下命令）


# 安装依赖（首次运行）
pip install -r requirements.txt

# 启动 Python 服务（运行在 5000 端口）
python start.py
```

**验证**：访问 http://localhost:5000/docs 查看 API 文档

---

### 第二步：启动 Spring Boot 后端服务

**注意**：需要先启动 Python 服务，因为 Spring Boot 会代理请求到 Python 服务。

```powershell
# 进入后端目录
cd backend

# 配置环境变量（可选，用于 PPT 模块）
$env:OPENAI_API_KEY="0e420f1b-15e6-47d2-adf3-ef8987c1a9ca"
$env:OPENAI_BASE_URL="https://ark.cn-beijing.volces.com/api/v3"
$env:VOLC_RAW="1"

# 启动 Spring Boot 服务
mvn spring-boot:run
# 或者跳过测试：mvn -DskipTests spring-boot:run
```

**验证**：访问 http://localhost:8081 查看后端服务状态

---

### 第三步：启动前端模块

前端有三个独立模块，需要分别在不同的终端窗口中启动。

#### 3.1 PPT 模块（端口 3001）

```powershell
# 打开新的终端窗口
cd frontend/modules/ppt

# 安装依赖（首次运行，使用 --legacy-peer-deps 解决 Node.js 16 兼容性问题）
npm install --legacy-peer-deps

# 启动开发服务器
npm run dev
```

**访问地址**：http://localhost:3001

---

#### 3.2 教案模块（端口 3000）

```powershell
# 打开新的终端窗口
cd frontend/modules/lessonplan

# 安装依赖（首次运行，使用 --legacy-peer-deps 解决 Node.js 16 兼容性问题）
npm install --legacy-peer-deps

# 启动开发服务器
npm run dev
```

**访问地址**：http://localhost:3000

---

#### 3.3 资源管理模块（端口 3002）

```powershell
# 打开新的终端窗口
cd frontend/modules/resource

# 安装依赖（首次运行）
npm install

# 启动开发服务器
npm run dev
```

**访问地址**：http://localhost:3002

---

## 📝 重要提示

1. **启动顺序**：
   - 必须先启动 Python 服务（端口 5000）
   - 然后启动 Spring Boot 服务（端口 8081）
   - 最后启动前端模块（可以并行启动）

2. **Node.js 版本兼容性**：
   - 当前系统使用 Node.js 16.20.2
   - PPT 和教案模块需要使用 `--legacy-peer-deps` 安装依赖
   - 资源管理模块可以直接使用 `npm install`

3. **端口占用**：
   - 确保以下端口未被占用：5000, 8081, 3000, 3001, 3002

4. **环境变量**：
   - Python 服务需要在 `python_service` 目录下配置环境变量
   - 建议创建 `.env` 文件而不是使用命令行设置（更持久）

---

## 🔍 服务验证

启动完成后，可以通过以下方式验证服务是否正常运行：

- **Python 服务**：http://localhost:5000/docs
- **Spring Boot 服务**：http://localhost:8081
- **PPT 前端**：http://localhost:3001
- **教案前端**：http://localhost:3000
- **资源管理前端**：http://localhost:3002

---

## 🛠️ 故障排查

### 问题：npm install 报错（peer dependency 冲突）
**解决方案**：使用 `npm install --legacy-peer-deps`

### 问题：Vite 启动失败（crypto.getRandomValues is not a function）
**解决方案**：已修复，Vite 版本已降级到 4.5.5 以兼容 Node.js 16

### 问题：Spring Boot 启动失败（Bean 冲突）
**解决方案**：已通过自定义 TypeFilter 解决，无需手动处理

### 问题：前端无法连接后端
**检查项**：
1. 确认 Spring Boot 服务已启动（端口 8081）
2. 确认 Python 服务已启动（端口 5000）
3. 检查浏览器控制台的错误信息
4. 确认 CORS 配置正确
