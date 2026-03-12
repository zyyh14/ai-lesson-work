import { Presentation, Message } from '../types';
import { DEFAULT_THEME } from '../utils/presentationSync';

/**
 * 课件 API 封装：
 * - 与后端 `/api/lessons` 交互：创建、获取、同步、重命名、删除、聊天。
 * - 处理版本冲突（409 CONFLICT），失败时支持离线模式写入 localStorage。
 * - 提供本地缓存列表与数据的读写，保证断网/后端不可用时仍可编辑。
 */

const API_BASE = '/api'; 
const STORAGE_KEY = 'gemini_lesson_data';
const LIST_KEY = `${STORAGE_KEY}_list`;

export interface SyncResponse {
  version: number;
  offline?: boolean;
}

interface BackendLessonResponse {
  lesson: {
    id: string;
    slidesData: string; 
    markdownContent: string;
    version: number;
    title: string;
  };
  history: Message[];
}

export interface LoadResponse {
  lesson: Presentation;
  history: Message[];
  offline?: boolean;
}

// --- Local Storage Helpers for Offline Mode ---

const getLocalData = (id: string): LoadResponse | null => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${id}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to read local storage", e);
  }
  return null;
};

const saveLocalData = (id: string, data: LoadResponse) => {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${id}`, JSON.stringify(data));
  } catch (e) {
    console.warn("Failed to write local storage", e);
  }
};

const getLocalLessonList = (): { id: string; title: string; lastModified: number }[] => {
  try {
    const raw = localStorage.getItem(LIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveLocalLessonList = (list: { id: string; title: string; lastModified: number }[]) => {
  try {
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("Failed to write local lesson list", e);
  }
};

const upsertLocalLessonListItem = (item: { id: string; title: string; lastModified: number }) => {
  const list = getLocalLessonList();
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx >= 0) list[idx] = item;
  else list.push(item);
  saveLocalLessonList(list);
};

const removeLocalLessonListItem = (id: string) => {
  const list = getLocalLessonList().filter((x) => x.id !== id);
  saveLocalLessonList(list);
};

// --- API Service ---

export const lessonService = {
  getAllLessons: async (): Promise<{ id: string; title: string; lastModified: number }[]> => {
    try {
      const response = await fetch(`${API_BASE}/lessons`);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const data = await response.json();
      const list = Array.isArray(data?.lessons) ? data.lessons : [];
      saveLocalLessonList(list);
      return list;
    } catch (e) {
      console.warn("Backend unavailable, loading lesson list from local storage.", e);
      return getLocalLessonList();
    }
  },

  createLesson: async (): Promise<string> => {
    try {
      const response = await fetch(`${API_BASE}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const data = await response.json();
      const id = String(data?.id);
      if (!id || id === 'undefined') throw new Error('Invalid create response');
      upsertLocalLessonListItem({ id, title: data?.title || '未命名课件', lastModified: data?.lastModified || Date.now() });
      return id;
    } catch (e) {
      console.warn("Create failed (Offline Mode), creating locally.", e);
      const id = Date.now().toString();
      const now = Date.now();
      upsertLocalLessonListItem({ id, title: '未命名课件', lastModified: now });
      saveLocalData(id, {
        lesson: { id, version: 1, title: '未命名课件', theme: DEFAULT_THEME, slides: [] },
        history: [],
        offline: true
      });
      return id;
    }
  },

  deleteLesson: async (id: string): Promise<void> => {
    try {
      await fetch(`${API_BASE}/lessons/${id}`, { method: 'DELETE' });
    } finally {
      removeLocalLessonListItem(id);
      try {
        localStorage.removeItem(`${STORAGE_KEY}_${id}`);
      } catch {
      }
    }
  },

  renameLesson: async (id: string, newTitle: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/lessons/${id}/title`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
    } catch (e) {
      console.warn("Rename failed (Offline Mode), updating locally.", e);
    } finally {
      const list = getLocalLessonList();
      const item = list.find((x) => x.id === id);
      const now = Date.now();
      if (item) {
        upsertLocalLessonListItem({ ...item, title: newTitle, lastModified: now });
      } else {
        upsertLocalLessonListItem({ id, title: newTitle, lastModified: now });
      }
      const existing = getLocalData(id);
      if (existing) {
        saveLocalData(id, {
          ...existing,
          lesson: { ...existing.lesson, title: newTitle }
        });
      }
    }
  },

  /**
   * Loads the lesson state. Falls back to localStorage if backend fails.
   */
  getLesson: async (id: string): Promise<LoadResponse> => {
    try {
      const response = await fetch(`${API_BASE}/lessons/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data: BackendLessonResponse = await response.json();
      
      // Deserialize the JSON string stored in DB
      let parsedLesson: Presentation;
      try {
        // Safety check: ensure slidesData is a string before parsing
        const rawSlides = typeof data.lesson.slidesData === 'string' 
          ? data.lesson.slidesData 
          : JSON.stringify(data.lesson.slidesData);
          
        parsedLesson = JSON.parse(rawSlides);
        parsedLesson.id = data.lesson.id;
        parsedLesson.version = data.lesson.version;
      } catch (e) {
        console.error("Data corruption detected", e);
        throw new Error("Corrupt lesson data");
      }

      const result = {
        lesson: parsedLesson,
        history: data.history,
        offline: false
      };

      // Update local cache on successful load
      saveLocalData(id, result);
      return result;

    } catch (error) {
      console.warn("Backend unavailable, loading from local storage.", error);
      const local = getLocalData(id);
      if (local) {
        return { ...local, offline: true };
      }
      throw error; // Re-throw if no local data exists (App will handle default)
    }
  },

  /**
   * Syncs lesson. Saves to localStorage if backend fails.
   */
  syncLesson: async (lesson: Presentation, markdown: string): Promise<SyncResponse> => {
    const lessonId = lesson.id || '1';
    const payload = {
      slidesData: JSON.stringify(lesson), 
      markdownContent: markdown,
      version: lesson.version || 0
    };

    try {
      const response = await fetch(`${API_BASE}/lessons/${lessonId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 409) throw new Error("CONFLICT");
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      upsertLocalLessonListItem({
        id: lessonId,
        title: lesson.title || '未命名课件',
        lastModified: Date.now()
      });
      return { version: data.version, offline: false };

    } catch (error: any) {
      if (error.message === "CONFLICT") throw error;

      console.warn("Sync failed (Offline Mode), saving locally.");
      
      // Construct full state for local save
      // We attempt to read existing history to preserve it
      const existing = getLocalData(lessonId);
      const history = existing ? existing.history : [];
      
      const newVersion = (lesson.version || 0) + 1;
      const newLessonState = { ...lesson, version: newVersion };
      
      saveLocalData(lessonId, {
        lesson: newLessonState,
        history: history,
        offline: true
      });

      upsertLocalLessonListItem({
        id: lessonId,
        title: lesson.title || '未命名课件',
        lastModified: Date.now()
      });
      
      // Return success with offline flag
      return { version: newVersion, offline: true };
    }
  },

  /**
   * Saves chat message. Fire-and-forget with local fallback.
   */
  saveMessage: async (lessonId: string, message: Message): Promise<void> => {
    try {
        await fetch(`${API_BASE}/lessons/${lessonId}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
        });
    } catch (e) {
        // Save to local history
        const existing = getLocalData(lessonId);
        if (existing) {
            existing.history.push(message);
            saveLocalData(lessonId, existing);
        }
    }
  }
};
