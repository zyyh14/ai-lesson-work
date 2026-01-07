import { LessonPlanHistoryDetail, LessonPlanHistoryItem } from "../types";

const getBaseUrl = () => (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:8081";

export const listLessonPlans = async (limit = 20): Promise<LessonPlanHistoryItem[]> => {
  const url = `${getBaseUrl()}/api/lesson-plans?limit=${encodeURIComponent(String(limit))}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Backend error: ${resp.status} ${text}`);
  }
  return (await resp.json()) as LessonPlanHistoryItem[];
};

export const getLessonPlanDetail = async (id: number): Promise<LessonPlanHistoryDetail> => {
  const url = `${getBaseUrl()}/api/lesson-plans/${encodeURIComponent(String(id))}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Backend error: ${resp.status} ${text}`);
  }
  return (await resp.json()) as LessonPlanHistoryDetail;
};

export const deleteLessonPlan = async (id: number): Promise<void> => {
  const url = `${getBaseUrl()}/api/lesson-plans/${encodeURIComponent(String(id))}`;
  const resp = await fetch(url, { method: "DELETE" });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Backend error: ${resp.status} ${text}`);
  }
};
