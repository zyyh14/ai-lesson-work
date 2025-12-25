
export enum Sender {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  isToolOutput?: boolean;
}

// --- AI Models ---

export type AIModel = 'kimi-k2-thinking-251104' | 'doubao-seed-1-6-251015' | 'deepseek-v3-2-251201';

export const AI_MODELS: { id: AIModel; name: string; provider: string }[] = [
  { id: 'kimi-k2-thinking-251104', name: 'Kimi K2 Thinking', provider: 'Volcengine Ark' },
  { id: 'doubao-seed-1-6-251015', name: 'Doubao Seed 1.6', provider: 'Volcengine Ark' },
  { id: 'deepseek-v3-2-251201', name: 'DeepSeek V3.2', provider: 'Volcengine Ark' }
];

// --- Visual-First Data Structures ---

export interface SlideTheme {
  id: string;
  name: string;
  backgroundColor: string;
  titleColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
}

export interface Slide {
  id: string; // Unique ID for React keys
  type: 'title' | 'content' | 'two-column' | 'diagram'; // Added 'diagram'
  title: string;
  content: string[]; // Bullet points or paragraphs
  mermaidCode?: string; // For diagram storage
  image?: string;
  notes?: string;
}

export interface Presentation {
  id?: string; // Database ID
  version?: number; // Optimistic locking version
  title: string;
  theme: SlideTheme;
  slides: Slide[];
}

export interface LessonSummary {
  id: string;
  title: string;
  lastModified: number;
}
