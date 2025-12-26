import { LessonPlanRequest } from "../types";

type LessonPlanResponse = {
  data: string;
};

export const generateLessonPlanStream = async (
  request: LessonPlanRequest,
  onChunk: (text: string) => void
): Promise<string> => {
  const backendBaseUrl = (import.meta as any).env?.VITE_BACKEND_URL || "http://localhost:8081";
  const url = `${backendBaseUrl}/api/lesson-plan`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(request)
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Backend error: ${resp.status} ${text}`);
  }

  const json = (await resp.json()) as LessonPlanResponse;
  const fullText = json?.data || "";

  // Simulate streaming for UX
  let i = 0;
  const step = Math.max(8, Math.floor(fullText.length / 120));
  while (i < fullText.length) {
    i = Math.min(fullText.length, i + step);
    onChunk(fullText.slice(0, i));
    await new Promise((r) => setTimeout(r, 10));
  }
  return fullText;
};