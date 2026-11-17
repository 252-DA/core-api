export type QuestionInput = {
  id?: string;
  position: number;
  type: string;
  question: string;
  options?: unknown;
  correctAnswer?: unknown;
  explanation?: string;
};

export type CreateMicroContentInput = {
  courseId: string;
  title: string;
  description?: string;
  videoSource?: 'UPLOAD' | 'AI';
  passingScore?: number;
  requiredWatchPercent?: number;
  sourceDocumentId?: string | null;
  sourcePageFrom?: number | null;
  sourcePageTo?: number | null;
  loId?: string | null;
  position?: number | null;
};

export type UpdateMicroContentInput = {
  microContentId: string;
  title?: string;
  description?: string;
  passingScore?: number;
  requiredWatchPercent?: number;
  aiPrompt?: string;
  aiOptions?: unknown;
  sourceDocumentId?: string | null;
  sourcePageFrom?: number | null;
  sourcePageTo?: number | null;
  loId?: string | null;
  position?: number | null;
};
