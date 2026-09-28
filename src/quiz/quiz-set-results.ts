import type { Prisma } from '@prisma/client';
import { AGS_STATUS } from '../ags/ags-status';
import type { QuizSnapshotItem } from './quiz-set.service';

/** Trạng thái điểm của một lượt nộp so với sổ điểm Canvas, theo góc nhìn người dùng. */
export type GradeSyncState =
  | 'POSTED'
  | 'SENDING'
  | 'WAITING_PUBLISH'
  | 'FAILED'
  | 'NOT_REQUIRED';

export interface ResultAttemptRow {
  submission_id: string | null;
  user_id: string;
  quiz_id: string;
  is_correct: boolean | null;
  score: Prisma.Decimal | number;
  attempted_at: Date | null;
  ags_status: string | null;
  resource_link_id: string | null;
  chosen_answer?: Prisma.JsonValue;
}

export interface SubmissionSummary {
  submissionId: string;
  userId: string;
  attemptedAt: string;
  score: number;
  sync: GradeSyncState;
}

interface Submission extends SubmissionSummary {
  correctByQuiz: Map<string, boolean>;
}

/**
 * Gom các dòng quiz_attempts (mỗi câu một dòng) thành từng lượt nộp.
 * `waiting(resourceLinkId)` cho biết Canvas đang từ chối điểm vì bài tập chưa
 * publish — trạng thái này chỉ poller AGS biết, DB vẫn ghi PENDING.
 */
export function groupSubmissions(
  rows: ResultAttemptRow[],
  waiting: (resourceLinkId: string) => boolean,
): Submission[] {
  const bySubmission = new Map<
    string,
    {
      userId: string;
      at: Date;
      total: number;
      count: number;
      statuses: Set<string>;
      links: Set<string>;
      correctByQuiz: Map<string, boolean>;
    }
  >();
  for (const row of rows) {
    if (!row.submission_id) continue;
    const entry = bySubmission.get(row.submission_id) ?? {
      userId: row.user_id,
      at: row.attempted_at ?? new Date(0),
      total: 0,
      count: 0,
      statuses: new Set<string>(),
      links: new Set<string>(),
      correctByQuiz: new Map<string, boolean>(),
    };
    entry.total += Number(row.score);
    entry.count += 1;
    entry.statuses.add(row.ags_status ?? AGS_STATUS.pending);
    if (row.resource_link_id) entry.links.add(row.resource_link_id);
    entry.correctByQuiz.set(row.quiz_id, Boolean(row.is_correct));
    bySubmission.set(row.submission_id, entry);
  }
  return [...bySubmission.entries()]
    .map(([submissionId, e]) => ({
      submissionId,
      userId: e.userId,
      attemptedAt: e.at.toISOString(),
      score: Math.round(e.total / e.count),
      sync: syncState(e.statuses, [...e.links].some(waiting)),
      correctByQuiz: e.correctByQuiz,
    }))
    .sort((a, b) => a.attemptedAt.localeCompare(b.attemptedAt));
}

function syncState(statuses: Set<string>, waiting: boolean): GradeSyncState {
  if (statuses.has(AGS_STATUS.failed)) return 'FAILED';
  if (statuses.has(AGS_STATUS.pending) || statuses.has(AGS_STATUS.posting))
    return waiting ? 'WAITING_PUBLISH' : 'SENDING';
  if (statuses.has(AGS_STATUS.notRequired)) return 'NOT_REQUIRED';
  return 'POSTED';
}

/**
 * Sổ điểm Canvas giữ điểm gửi sau cùng, mà mỗi lần gửi là điểm cao nhất tính
 * đến lượt đó — nên trạng thái của lượt mới nhất cho biết Canvas đã khớp chưa.
 */
function studentSync(submissions: Submission[]): GradeSyncState {
  return submissions[submissions.length - 1].sync;
}

export function learnerResults(submissions: Submission[]) {
  return {
    view: 'learner' as const,
    attempts: submissions.map(stripCorrect),
    bestScore: submissions.length
      ? Math.max(...submissions.map((s) => s.score))
      : null,
    sync: submissions.length ? studentSync(submissions) : null,
  };
}

export function staffResults(input: {
  items: QuizSnapshotItem[];
  submissions: Submission[];
  names: Map<string, string>;
  los: Map<string, { code: string; statement: string }>;
}) {
  const byStudent = new Map<string, Submission[]>();
  for (const s of input.submissions) {
    byStudent.set(s.userId, [...(byStudent.get(s.userId) ?? []), s]);
  }
  const students = [...byStudent.entries()]
    .map(([userId, subs]) => ({
      userId,
      name: input.names.get(userId) ?? 'Sinh viên',
      attempts: subs.length,
      bestScore: Math.max(...subs.map((s) => s.score)),
      latestScore: subs[subs.length - 1].score,
      lastAttemptedAt: subs[subs.length - 1].attemptedAt,
      sync: studentSync(subs),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  // Thống kê câu/LO theo lượt gần nhất của mỗi sinh viên: phản ánh mức hiểu
  // hiện tại, không bị lượt làm thử đầu tiên kéo xuống.
  const latest = [...byStudent.values()].map((subs) => subs[subs.length - 1]);
  const items = input.items.map((item) => {
    const answered = latest.filter((s) => s.correctByQuiz.has(item.quiz_id));
    const correct = answered.filter((s) => s.correctByQuiz.get(item.quiz_id));
    return {
      quiz_id: item.quiz_id,
      question: item.question,
      options: item.options,
      correct_answer: item.correct_answer,
      explanation: item.explanation,
      bloom_level: item.bloom_level,
      lo_code: item.lo_id ? (input.los.get(item.lo_id)?.code ?? null) : null,
      answered: answered.length,
      correct: correct.length,
    };
  });

  const loStats = new Map<string, { answered: number; correct: number; questions: number }>();
  for (const item of input.items) {
    if (!item.lo_id) continue;
    const stat = loStats.get(item.lo_id) ?? { answered: 0, correct: 0, questions: 0 };
    const row = items.find((i) => i.quiz_id === item.quiz_id)!;
    stat.answered += row.answered;
    stat.correct += row.correct;
    stat.questions += 1;
    loStats.set(item.lo_id, stat);
  }
  const byLo = [...loStats.entries()]
    .map(([loId, stat]) => ({
      lo_id: loId,
      code: input.los.get(loId)?.code ?? 'LO',
      statement: input.los.get(loId)?.statement ?? '',
      questions: stat.questions,
      correctRate: stat.answered ? Math.round((100 * stat.correct) / stat.answered) : null,
    }))
    .sort((a, b) => a.code.localeCompare(b.code, 'vi', { numeric: true }));

  return {
    view: 'staff' as const,
    items,
    byLo,
    students,
    summary: {
      students: students.length,
      submissions: input.submissions.length,
      averageBest: students.length
        ? Math.round(students.reduce((sum, s) => sum + s.bestScore, 0) / students.length)
        : null,
      waitingForPublish: students.filter((s) => s.sync === 'WAITING_PUBLISH').length,
      failed: students.filter((s) => s.sync === 'FAILED').length,
    },
  };
}

function stripCorrect({ correctByQuiz: _omit, ...rest }: Submission): SubmissionSummary {
  return rest;
}

/**
 * Bài làm của một lượt nộp, kèm đáp án đúng và giải thích — chỉ gọi khi đã
 * được mở đáp án (luyện tập, hoặc bài kiểm tra đã đóng).
 */
export function reviewOf(
  items: QuizSnapshotItem[],
  rows: ResultAttemptRow[],
  submissionId: string,
) {
  const mine = new Map(
    rows
      .filter((r) => r.submission_id === submissionId)
      .map((r) => [r.quiz_id, r]),
  );
  return items.map((item) => {
    const row = mine.get(item.quiz_id);
    return {
      quiz_id: item.quiz_id,
      question: item.question,
      options: item.options,
      chosen: row?.chosen_answer ?? null,
      correct_answer: item.correct_answer,
      is_correct: Boolean(row?.is_correct),
      explanation: item.explanation,
    };
  });
}
