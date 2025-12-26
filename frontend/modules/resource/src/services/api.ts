// API 服务层 - 调用后端接口
// 通过 Spring Boot 代理访问 Python 服务

const API_BASE_URL = 'http://localhost:8081/api/resource';

export interface Resource {
  id: number;
  title: string;
  type: string;
  content: string;
  source_url: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

export interface ResourceSearchResponse {
  resources: Resource[];
  total: number;
  page: number;
  limit: number;
}

export interface Exercise {
  type: string;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
}

export interface ExerciseGenerateResponse {
  knowledge_point: string;
  exercises: Exercise[];
  total_count: number;
  status: string;
}

/**
 * 搜索教学资源
 * @param query 搜索关键词
 * @param limit 搜索资源数量，默认5
 * @param page 页码，默认1
 */
export async function searchResources(
  query: string,
  limit: number = 5,
  page: number = 1
): Promise<ResourceSearchResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/search?query=${encodeURIComponent(query)}&limit=${limit}&page=${page}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '搜索资源失败');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('网络连接失败，请检查后端服务是否启动（http://localhost:8081）');
      }
      throw error;
    }
    throw new Error('搜索资源时发生未知错误');
  }
}

/**
 * 生成练习题
 * @param knowledgePoint 知识点
 */
export async function generateExercises(
  knowledgePoint: string
): Promise<ExerciseGenerateResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/exercises/generate`,
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
      const error = await response.json();
      throw new Error(error.detail || '生成练习题失败');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('网络连接失败，请检查后端服务是否启动（http://localhost:8081）');
      }
      throw error;
    }
    throw new Error('生成练习题时发生未知错误');
  }
}

/**
 * 健康检查
 */
export async function healthCheck(): Promise<{ status: string }> {
  try {
    const response = await fetch('http://localhost:8081/api/resource/health');
    return await response.json();
  } catch (error) {
    throw new Error('后端服务未启动');
  }
}

// ==================== 收藏功能 ====================

export interface FavoriteResource {
  id: number;
  user_id: number;
  resource_id: number;
  notes: string;
  created_at: string;
  resources: Resource;
}

export interface FavoriteResourcesResponse {
  favorites: FavoriteResource[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 收藏教学资源
 * @param resourceId 资源ID
 * @param notes 收藏备注
 * @param userId 用户ID，默认1
 */
export async function favoriteResource(
  resourceId: number,
  notes: string = '',
  userId: number = 1
): Promise<{ status: string; message: string; data: any }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/favorites/resources?user_id=${userId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          resource_id: resourceId,
          notes: notes
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '收藏失败');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('收藏资源时发生未知错误');
  }
}

/**
 * 取消收藏资源
 * @param resourceId 资源ID
 * @param userId 用户ID，默认1
 */
export async function unfavoriteResource(
  resourceId: number,
  userId: number = 1
): Promise<{ status: string; message: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/favorites/resources/${resourceId}?user_id=${userId}`,
      {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '取消收藏失败');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('取消收藏时发生未知错误');
  }
}

/**
 * 获取收藏的资源列表
 * @param userId 用户ID，默认1
 * @param limit 每页数量，默认20
 * @param page 页码，默认1
 */
export async function getFavoriteResources(
  userId: number = 1,
  limit: number = 20,
  page: number = 1
): Promise<FavoriteResourcesResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/favorites/resources?user_id=${userId}&limit=${limit}&page=${page}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || '获取收藏列表失败');
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('获取收藏列表时发生未知错误');
  }
}




// --- 练习题收藏相关接口 ---

export interface FavoriteExercise {
  id: number;
  user_id: number;
  exercise_id: number;
  notes: string;
  created_at: string;
  exercises: {
    id: number;
    knowledge_point: string;
    type: string;
    question: string;
    options?: string[] | string; // 后端可能返回 JSON 字符串或数组
    answer: string;
    explanation: string;
  }
}

export interface FavoriteExercisesResponse {
  favorites: FavoriteExercise[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 收藏练习题
 */
export async function favoriteExercise(
  exerciseId: number,
  notes: string = '',
  userId: number = 1
): Promise<{ status: string; message: string; data: any }> {
  const response = await fetch(`${API_BASE_URL}/favorites/exercises?user_id=${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exercise_id: exerciseId, notes })
  });
  if (!response.ok) throw new Error('收藏练习题失败');
  return await response.json();
}

/**
 * 取消收藏练习题
 */
export async function unfavoriteExercise(
  exerciseId: number,
  userId: number = 1
): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE_URL}/favorites/exercises/${exerciseId}?user_id=${userId}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('取消收藏练习题失败');
  return await response.json();
}

/**
 * 获取收藏的练习题列表
 */
export async function getFavoriteExercises(
  userId: number = 1,
  limit: number = 20,
  page: number = 1
): Promise<FavoriteExercisesResponse> {
  const response = await fetch(`${API_BASE_URL}/favorites/exercises?user_id=${userId}&limit=${limit}&page=${page}`);
  if (!response.ok) throw new Error('获取练习题收藏列表失败');
  return await response.json();
}