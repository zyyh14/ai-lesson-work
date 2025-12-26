export interface ClassInput {
  gradeSheetText?: string;   // Copied from Excel
  gradeSheetImage?: string;  // Photo of the score sheet (Base64)
  paperImage?: string;       // Photo of a student's paper (Base64)
}

export interface ScoreDistribution {
  range: string;
  count: number;
}

export interface KnowledgePoint {
  topic: string;
  masteryRate: number; // 0-100
  status: 'Critical' | 'Warning' | 'Good';
}

export interface StudentGroup {
  groupName: string;
  description: string;
  students: string[]; 
  strategy: string;
}

// Individual Student Insight
export interface StudentInsight {
  name: string; // generated or parsed
  score: number | string;
  trend: 'up' | 'down' | 'stable';
  tags: string[];
  weakness: string;
  learningPlan: string; // Personalized plan
}

// Identified Mistake from the paper
export interface MistakePoint {
  id: string;
  topic: string;
  description: string; 
  errorRate: number; 
  exampleQuestion?: string; 
}

export interface AnalysisResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  scoreDistribution: ScoreDistribution[];
  knowledgePoints: KnowledgePoint[];
  teachingSuggestions: string[];
  groups: StudentGroup[];
  studentInsights: StudentInsight[]; 
  identifiedMistakes: MistakePoint[]; 
}

// Remedial Exam Structure
export interface RemedialQuestion {
  knowledgePoint: string;
  originalErrorContext: string; 
  question: string; 
  options?: string[]; // If MC
  answer: string;
  explanation: string;
}

export interface RemedialPaper {
  title: string;
  questions: RemedialQuestion[];
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  GENERATING_PAPER = 'GENERATING_PAPER', 
}
