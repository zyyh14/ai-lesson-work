# 智能备课系统 - API接口文档

## 基础信息

**Base URL**: `http://localhost:8000`

**API版本**: v1

**API前缀**: `/api/v1`

**数据格式**: JSON

**字符编码**: UTF-8

---

## 接口概览表

| 接口 | 方法 | 路径 | 功能 |
|------|------|------|------|
| 健康检查 | GET | `/health` | 检查服务状态 |
| 资源搜索 | GET | `/api/v1/resources/search` | AI搜索整理教学资源 |
| 生成练习题 | POST | `/api/v1/exercises/generate` | 根据知识点生成题目 |
| 收藏资源 | POST | `/api/v1/favorites/resources/favorite` | 收藏教学资源 |
| 取消收藏资源 | DELETE | `/api/v1/favorites/resources/favorite/{id}` | 取消收藏 |
| 收藏列表 | GET | `/api/v1/favorites/resources/favorites` | 查看收藏的资源 |
| 收藏练习题 | POST | `/api/v1/favorites/exercises/favorite` | 收藏练习题 |
| 取消收藏练习题 | DELETE | `/api/v1/favorites/exercises/favorite/{id}` | 取消收藏 |
| 练习题收藏列表 | GET | `/api/v1/favorites/exercises/favorites` | 查看收藏的练习题 |

---

## 接口列表

### 1. 健康检查

检查服务是否正常运行。

**接口地址**: `GET /health`

**请求参数**: 无

**响应示例**:
```json
{
  "status": "healthy"
}
```

---

### 2. 教学资源智能搜索 ⭐

使用AI搜索、爬取、整理教学资源，并保存到数据库。

**接口地址**: `GET /api/v1/resources/search`

**功能说明**:
1. 使用Tavily搜索引擎搜索相关教学资源
2. 自动爬取搜索结果中的网页内容
3. 使用智谱AI整理所有资源成一份完整的教学报告
4. 自动保存到数据库
5. 返回整理后的完整报告

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| query | string | 是 | 搜索关键词 | "静夜思资源" |
| limit | integer | 否 | 搜索资源数量，默认10，最大100 | 5 |
| page | integer | 否 | 页码，默认1 | 1 |

**请求示例**:
```
GET /api/v1/resources/search?query=静夜思资源&limit=5&page=1
```

**响应参数**:

| 字段名 | 类型 | 说明 |
|--------|------|------|
| resources | array | 资源列表 |
| resources[].id | integer | 资源ID |
| resources[].title | string | 资源标题 |
| resources[].type | string | 资源类型（教案/课件/习题/视频） |
| resources[].content | string | AI整理后的完整内容 |
| resources[].source_url | string | 参考资源URL（多个用逗号分隔） |
| resources[].tags | string | 标签 |
| resources[].created_at | string | 创建时间（ISO 8601格式） |
| resources[].updated_at | string | 更新时间（ISO 8601格式） |
| total | integer | 资源总数 |
| page | integer | 当前页码 |
| limit | integer | 每页数量 |

**响应示例**:
```json
{
  "resources": [
    {
      "id": 1,
      "title": "静夜思资源 - 教学资源整理报告",
      "type": "教案",
      "content": "# 静夜思资源 - 教学资源整理报告\n\n## 一、资源概述\n《静夜思》是唐代诗人李白的经典作品...\n\n## 二、核心知识点\n1. 诗歌背景...\n2. 重点字词...\n\n## 三、教学建议\n1. 情境导入...\n2. 朗读指导...\n\n## 四、参考资源\n1. https://example.com/resource1\n2. https://example.com/resource2",
      "source_url": "https://example.com/resource1, https://example.com/resource2, https://example.com/resource3",
      "tags": "静夜思资源",
      "created_at": "2025-12-20T14:30:00Z",
      "updated_at": "2025-12-20T14:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 5
}
```

**响应时间**: 20-40秒（包含搜索、爬取、AI整理）

**错误响应**:
```json
{
  "detail": "错误信息描述"
}
```

**状态码**:
- `200`: 成功
- `422`: 参数验证失败
- `500`: 服务器内部错误

---

### 3. 练习题生成

根据知识点自动生成练习题（选择题、填空题、简答题）。

**接口地址**: `POST /api/v1/exercises/generate`

**请求头**:
```
Content-Type: application/json
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| knowledge_point | string | 是 | 知识点 | "李白《静夜思》" |

**请求示例**:
```json
{
  "knowledge_point": "李白《静夜思》"
}
```

**响应参数**:

| 字段名 | 类型 | 说明 |
|--------|------|------|
| knowledge_point | string | 知识点 |
| exercises | array | 练习题列表 |
| exercises[].type | string | 题目类型（选择题/填空题/简答题） |
| exercises[].question | string | 题目内容 |
| exercises[].options | array | 选项（仅选择题有） |
| exercises[].answer | string | 答案 |
| exercises[].explanation | string | 解析 |
| total_count | integer | 题目总数 |
| status | string | 状态（success/error） |

**响应示例**:
```json
{
  "knowledge_point": "李白《静夜思》",
  "exercises": [
    {
      "type": "选择题",
      "question": "《静夜思》的作者是谁？",
      "options": ["A. 杜甫", "B. 李白", "C. 白居易", "D. 王维"],
      "answer": "B",
      "explanation": "《静夜思》是唐代诗人李白的作品"
    },
    {
      "type": "填空题",
      "question": "床前明月光，___。",
      "answer": "疑是地上霜",
      "explanation": "这是《静夜思》的第二句"
    },
    {
      "type": "简答题",
      "question": "请简述《静夜思》表达的情感。",
      "answer": "表达了诗人在异乡的思乡之情",
      "explanation": "要点：思乡、孤独、对家乡的怀念"
    }
  ],
  "total_count": 3,
  "status": "success"
}
```

**响应时间**: 5-15秒

**错误响应**:
```json
{
  "detail": "错误信息描述"
}
```

**状态码**:
- `200`: 成功
- `422`: 参数验证失败
- `500`: 服务器内部错误

---

### 4. 收藏教学资源 ⭐

收藏喜欢的教学资源，方便后续查看。

**接口地址**: `POST /api/v1/favorites/resources/favorite`

**请求参数**:

| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| user_id | integer | Query | 否 | 用户ID，默认1 |
| resource_id | integer | Body | 是 | 资源ID |
| notes | string | Body | 否 | 收藏备注 |

**请求示例**:
```bash
POST /api/v1/favorites/resources/favorite?user_id=1
Content-Type: application/json

{
  "resource_id": 2,
  "notes": "很好的教学资源"
}
```

**响应示例**:
```json
{
  "status": "success",
  "message": "收藏成功",
  "data": {
    "id": 1,
    "user_id": 1,
    "resource_id": 2,
    "notes": "很好的教学资源",
    "created_at": "2025-12-20T10:00:00Z"
  }
}
```

---

### 5. 取消收藏资源

取消已收藏的教学资源。

**接口地址**: `DELETE /api/v1/favorites/resources/favorite/{resource_id}`

**请求参数**:

| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| resource_id | integer | Path | 是 | 资源ID |
| user_id | integer | Query | 否 | 用户ID，默认1 |

**请求示例**:
```bash
DELETE /api/v1/favorites/resources/favorite/2?user_id=1
```

**响应示例**:
```json
{
  "status": "success",
  "message": "取消收藏成功"
}
```

---

### 6. 获取收藏的资源列表

查看用户收藏的所有教学资源。

**接口地址**: `GET /api/v1/favorites/resources/favorites`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| user_id | integer | 否 | 用户ID | 1 |
| limit | integer | 否 | 每页数量 | 20 |
| page | integer | 否 | 页码 | 1 |

**请求示例**:
```bash
GET /api/v1/favorites/resources/favorites?user_id=1&limit=20&page=1
```

**响应示例**:
```json
{
  "favorites": [
    {
      "id": 1,
      "user_id": 1,
      "resource_id": 2,
      "notes": "很好的教学资源",
      "created_at": "2025-12-20T10:00:00Z",
      "resources": {
        "id": 2,
        "title": "静夜思资源 - 教学资源整理报告",
        "type": "教案",
        "content": "...",
        "source_url": "...",
        "tags": "静夜思资源"
      }
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

---

### 7. 收藏练习题

收藏重要的练习题。

**接口地址**: `POST /api/v1/favorites/exercises/favorite`

**请求参数**:

| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| user_id | integer | Query | 否 | 用户ID，默认1 |
| exercise_id | integer | Body | 是 | 练习题ID |
| notes | string | Body | 否 | 收藏备注 |

**请求示例**:
```bash
POST /api/v1/favorites/exercises/favorite?user_id=1
Content-Type: application/json

{
  "exercise_id": 1,
  "notes": "重点题目"
}
```

**响应示例**:
```json
{
  "status": "success",
  "message": "收藏成功",
  "data": {
    "id": 1,
    "user_id": 1,
    "exercise_id": 1,
    "notes": "重点题目",
    "created_at": "2025-12-20T10:00:00Z"
  }
}
```

---

### 8. 取消收藏练习题

取消已收藏的练习题。

**接口地址**: `DELETE /api/v1/favorites/exercises/favorite/{exercise_id}`

**请求参数**:

| 参数名 | 类型 | 位置 | 必填 | 说明 |
|--------|------|------|------|------|
| exercise_id | integer | Path | 是 | 练习题ID |
| user_id | integer | Query | 否 | 用户ID，默认1 |

**请求示例**:
```bash
DELETE /api/v1/favorites/exercises/favorite/1?user_id=1
```

**响应示例**:
```json
{
  "status": "success",
  "message": "取消收藏成功"
}
```

---

### 9. 获取收藏的练习题列表

查看用户收藏的所有练习题。

**接口地址**: `GET /api/v1/favorites/exercises/favorites`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| user_id | integer | 否 | 用户ID | 1 |
| limit | integer | 否 | 每页数量 | 20 |
| page | integer | 否 | 页码 | 1 |

**请求示例**:
```bash
GET /api/v1/favorites/exercises/favorites?user_id=1&limit=20&page=1
```

**响应示例**:
```json
{
  "favorites": [
    {
      "id": 1,
      "user_id": 1,
      "exercise_id": 1,
      "notes": "重点题目",
      "created_at": "2025-12-20T10:00:00Z",
      "exercises": {
        "id": 1,
        "knowledge_point": "李白《静夜思》",
        "type": "选择题",
        "question": "《静夜思》的作者是谁？",
        "options": ["A. 杜甫", "B. 李白", "C. 白居易", "D. 王维"],
        "answer": "B",
        "explanation": "这是唐代诗人李白的作品"
      }
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20
}
```

---

## 前端集成示例

### JavaScript (Fetch API)

#### 1. 搜索教学资源

```javascript
async function searchResources(query, limit = 5) {
  try {
    const response = await fetch(
      `http://localhost:8000/api/v1/resources/search?query=${encodeURIComponent(query)}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('搜索结果:', data);
    return data;
    
  } catch (error) {
    console.error('搜索失败:', error);
    throw error;
  }
}

// 使用示例
searchResources('静夜思资源', 5)
  .then(data => {
    // 处理返回的数据
    data.resources.forEach(resource => {
      console.log(resource.title);
      console.log(resource.content);
    });
  });
```

#### 2. 生成练习题

```javascript
async function generateExercises(knowledgePoint) {
  try {
    const response = await fetch(
      'http://localhost:8000/api/v1/exercises/generate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          knowledge_point: knowledgePoint
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('练习题:', data);
    return data;
    
  } catch (error) {
    console.error('生成失败:', error);
    throw error;
  }
}

// 使用示例
generateExercises('李白《静夜思》')
  .then(data => {
    data.exercises.forEach(exercise => {
      console.log(`${exercise.type}: ${exercise.question}`);
      console.log(`答案: ${exercise.answer}`);
    });
  });
```

### Axios

```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

// 搜索资源
async function searchResources(query, limit = 5) {
  const response = await axios.get(`${API_BASE}/resources/search`, {
    params: { query, limit }
  });
  return response.data;
}

// 生成练习题
async function generateExercises(knowledgePoint) {
  const response = await axios.post(`${API_BASE}/exercises/generate`, {
    knowledge_point: knowledgePoint
  });
  return response.data;
}

// 收藏资源
async function favoriteResource(resourceId, notes = '') {
  const response = await axios.post(
    `${API_BASE}/favorites/resources/favorite?user_id=1`,
    { resource_id: resourceId, notes }
  );
  return response.data;
}

// 获取收藏列表
async function getFavorites() {
  const response = await axios.get(
    `${API_BASE}/favorites/resources/favorites?user_id=1`
  );
  return response.data;
}

// 取消收藏
async function unfavoriteResource(resourceId) {
  const response = await axios.delete(
    `${API_BASE}/favorites/resources/favorite/${resourceId}?user_id=1`
  );
  return response.data;
}
```

### React 示例

```jsx
import { useState, useEffect } from 'react';

function ResourceSearch() {
  const [query, setQuery] = useState('');
  const [resources, setResources] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  // 加载收藏列表
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const response = await fetch(
        'http://localhost:8000/api/v1/favorites/resources/favorites?user_id=1'
      );
      const data = await response.json();
      setFavorites(data.favorites);
    } catch (error) {
      console.error('加载收藏失败:', error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/resources/search?query=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setResources(data.resources);
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (resourceId) => {
    try {
      await fetch(
        'http://localhost:8000/api/v1/favorites/resources/favorite?user_id=1',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resource_id: resourceId, notes: '' })
        }
      );
      loadFavorites();
      alert('收藏成功');
    } catch (error) {
      console.error('收藏失败:', error);
    }
  };

  const handleUnfavorite = async (resourceId) => {
    try {
      await fetch(
        `http://localhost:8000/api/v1/favorites/resources/favorite/${resourceId}?user_id=1`,
        { method: 'DELETE' }
      );
      loadFavorites();
      alert('取消收藏成功');
    } catch (error) {
      console.error('取消收藏失败:', error);
    }
  };

  const isFavorited = (resourceId) => {
    return favorites.some(fav => fav.resource_id === resourceId);
  };

  return (
    <div>
      <input 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="输入关键词"
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? '搜索中...' : '搜索'}
      </button>
      
      {resources.map(resource => (
        <div key={resource.id}>
          <h3>{resource.title}</h3>
          <pre>{resource.content}</pre>
          <button 
            onClick={() => isFavorited(resource.id) 
              ? handleUnfavorite(resource.id) 
              : handleFavorite(resource.id)
            }
          >
            {isFavorited(resource.id) ? '❤️ 已收藏' : '🤍 收藏'}
          </button>
        </div>
      ))}

      <h2>我的收藏</h2>
      {favorites.map(fav => (
        <div key={fav.id}>
          <h3>{fav.resources.title}</h3>
          <p>{fav.notes}</p>
          <button onClick={() => handleUnfavorite(fav.resource_id)}>
            取消收藏
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Vue 3 示例

```vue
<template>
  <div>
    <div>
      <input v-model="query" placeholder="输入关键词" />
      <button @click="search" :disabled="loading">
        {{ loading ? '搜索中...' : '搜索' }}
      </button>
    </div>

    <div v-for="resource in resources" :key="resource.id">
      <h3>{{ resource.title }}</h3>
      <pre>{{ resource.content }}</pre>
      <button @click="toggleFavorite(resource.id)">
        {{ isFavorited(resource.id) ? '❤️ 已收藏' : '🤍 收藏' }}
      </button>
    </div>

    <h2>我的收藏</h2>
    <div v-for="fav in favorites" :key="fav.id">
      <h3>{{ fav.resources.title }}</h3>
      <p>{{ fav.notes }}</p>
      <button @click="unfavorite(fav.resource_id)">取消收藏</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const query = ref('');
const resources = ref([]);
const favorites = ref([]);
const loading = ref(false);

const API_BASE = 'http://localhost:8000/api/v1';

onMounted(() => {
  loadFavorites();
});

const loadFavorites = async () => {
  try {
    const response = await fetch(`${API_BASE}/favorites/resources/favorites?user_id=1`);
    const data = await response.json();
    favorites.value = data.favorites;
  } catch (error) {
    console.error('加载收藏失败:', error);
  }
};

const search = async () => {
  loading.value = true;
  try {
    const response = await fetch(
      `${API_BASE}/resources/search?query=${encodeURIComponent(query.value)}&limit=5`
    );
    const data = await response.json();
    resources.value = data.resources;
  } catch (error) {
    console.error('搜索失败:', error);
  } finally {
    loading.value = false;
  }
};

const favorite = async (resourceId) => {
  try {
    await fetch(`${API_BASE}/favorites/resources/favorite?user_id=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource_id: resourceId, notes: '' })
    });
    loadFavorites();
  } catch (error) {
    console.error('收藏失败:', error);
  }
};

const unfavorite = async (resourceId) => {
  try {
    await fetch(`${API_BASE}/favorites/resources/favorite/${resourceId}?user_id=1`, {
      method: 'DELETE'
    });
    loadFavorites();
  } catch (error) {
    console.error('取消收藏失败:', error);
  }
};

const isFavorited = (resourceId) => {
  return favorites.value.some(fav => fav.resource_id === resourceId);
};

const toggleFavorite = (resourceId) => {
  if (isFavorited(resourceId)) {
    unfavorite(resourceId);
  } else {
    favorite(resourceId);
  }
};
</script>
```

---

## CORS 配置

后端已配置CORS，允许所有来源访问：

```python
allow_origins=["*"]
allow_credentials=True
allow_methods=["*"]
allow_headers=["*"]
```

如需限制特定域名，请修改 `app/main.py` 中的CORS配置。

---

## 错误处理

### 常见错误码

| 状态码 | 说明 | 处理建议 |
|--------|------|----------|
| 200 | 成功 | - |
| 422 | 参数验证失败 | 检查请求参数格式 |
| 500 | 服务器错误 | 查看后端日志，检查配置 |

### 错误响应格式

```json
{
  "detail": "错误描述信息"
}
```

### 前端错误处理示例

```javascript
async function searchWithErrorHandling(query) {
  try {
    const response = await fetch(
      `http://localhost:8000/api/v1/resources/search?query=${encodeURIComponent(query)}`
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '请求失败');
    }
    
    return await response.json();
    
  } catch (error) {
    // 网络错误
    if (error.message === 'Failed to fetch') {
      alert('网络连接失败，请检查后端服务是否启动');
    } else {
      alert(`错误: ${error.message}`);
    }
    throw error;
  }
}
```

---

## 性能优化建议

### 1. 请求超时设置

资源搜索接口需要20-40秒，建议设置合适的超时时间：

```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时

fetch(url, { signal: controller.signal })
  .then(response => {
    clearTimeout(timeoutId);
    return response.json();
  });
```

### 2. 加载状态提示

```javascript
// 显示加载进度
function showLoading() {
  document.getElementById('loading').innerHTML = `
    <div>正在搜索网络资源...</div>
    <div>正在爬取网页内容...</div>
    <div>AI正在整理资源...</div>
    <div>预计需要 20-40 秒</div>
  `;
}
```

### 3. 结果缓存

```javascript
const cache = new Map();

async function searchWithCache(query) {
  if (cache.has(query)) {
    return cache.get(query);
  }
  
  const result = await searchResources(query);
  cache.set(query, result);
  return result;
}
```

---

## 测试工具

### 1. Swagger UI

访问 `http://localhost:8000/docs` 可以在线测试所有接口。

### 2. curl 命令

```bash
# 搜索资源
curl "http://localhost:8000/api/v1/resources/search?query=静夜思资源&limit=5"

# 生成练习题
curl -X POST "http://localhost:8000/api/v1/exercises/generate" \
  -H "Content-Type: application/json" \
  -d '{"knowledge_point": "李白《静夜思》"}'

# 收藏资源
curl -X POST "http://localhost:8000/api/v1/favorites/resources/favorite?user_id=1" \
  -H "Content-Type: application/json" \
  -d '{"resource_id": 2, "notes": "很好的资源"}'

# 获取收藏列表
curl "http://localhost:8000/api/v1/favorites/resources/favorites?user_id=1"

# 取消收藏
curl -X DELETE "http://localhost:8000/api/v1/favorites/resources/favorite/2?user_id=1"
```

### 3. Postman

导入以下配置：

```json
{
  "info": {
    "name": "智能备课系统API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "搜索资源",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:8000/api/v1/resources/search?query=静夜思资源&limit=5",
          "query": [
            {"key": "query", "value": "静夜思资源"},
            {"key": "limit", "value": "5"}
          ]
        }
      }
    }
  ]
}
```

---

## 联系支持

- 查看完整文档: `README_FIXED.md`
- API文档: `http://localhost:8000/docs`
- 测试页面: `frontend.html`

---

**最后更新**: 2025-12-20
**API版本**: v1.0.0
