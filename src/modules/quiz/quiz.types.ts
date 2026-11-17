import type { Prisma } from '@prisma/client';

export type QuizSnapshotItem = {
  quiz_id: string;
  question: string;
  type: string;
  options: Prisma.JsonValue;
  correct_answer: Prisma.JsonValue;
  explanation: string | null;
  lo_id: string | null;
  bloom_level: number | null;
  source_chunk_ids: string[];
};
