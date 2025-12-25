export interface LessonPlanRequest {
  subject: string;
  gradeLevel: string;
  topic: string;
  duration: string;
  objectives: string;
  additionalNotes: string;
  templateImage?: string;
}

export interface GenerationConfig {
  apiKey: string;
}

export interface LessonPlanHistoryItem {
  id: number;
  createdAt: number;
  subject: string;
  gradeLevel: string;
  topic: string;
  hasTemplate: boolean;
}

export interface LessonPlanHistoryDetail {
  id: number;
  createdAt: number;
  request: LessonPlanRequest;
  data: string;
}

export enum ViewMode {
  EDIT = 'EDIT',
  PREVIEW = 'PREVIEW'
}