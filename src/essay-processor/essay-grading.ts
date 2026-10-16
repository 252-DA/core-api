import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

/**
 * Chấm bài luận nộp file qua LTI Asset Processor ("Document Processor" trong
 * Canvas). Xem docs/essay-asset-processor.md và migration
 * 20261014160000_essay_asset_processor.
 */

/** Outbox chuyển sự kiện này sang hàng đợi `essay_grading` của worker. */
export const ESSAY_GRADING_REQUESTED = 'ESSAY_GRADING_REQUESTED';
export const ESSAY_GRADING_QUEUE = 'essay_grading';

export const ESSAY_STATUS = {
  received: 'RECEIVED',
  queued: 'QUEUED',
  graded: 'GRADED',
  reported: 'REPORTED',
  failed: 'FAILED',
} as const;

export const SUBMISSION_NOTICE = 'LtiAssetProcessorSubmissionNotice';
export const PNS_SCOPE = 'https://purl.imsglobal.org/spec/lti/scope/noticehandlers';
export const ASSET_SCOPE = 'https://purl.imsglobal.org/spec/lti/scope/asset.readonly';
export const REPORT_SCOPE = 'https://purl.imsglobal.org/spec/lti/scope/report';
/** Canvas giữ báo cáo mới nhất theo (processor, asset, type). */
export const REPORT_TYPE = 'da_essay_grading';
const REPORT_TITLE = 'Chấm bài AI (điểm gợi ý)';

export type RubricCriterion = { criterion: string; description: string; points: number };

export type EssayAsset = {
  asset_id: string;
  url: string;
  title: string | null;
  content_type: string | null;
  size: number | null;
  sha256: string | null;
  /** Có sau khi core-api tải file về MinIO. */
  storage_key?: string;
};

/** Worker ghi vào essay_submissions.result (worker/use_cases/grade_essay_submission.py). */
export type EssayResult = {
  score: number;
  max_score: number;
  criteria: { criterion: string; points: number; max_points: number; comment: string }[];
  feedback: string;
  truncated?: boolean;
};

const MAX_CRITERIA = 10;

function text(value: unknown, max: number, label: string, required = true) {
  const out = typeof value === 'string' ? value.trim() : '';
  if (required && !out) throw new BadRequestException(`${label} không được để trống.`);
  if (out.length > max) throw new BadRequestException(`${label} dài quá ${max} ký tự.`);
  return out;
}

/** Kiểm tra rubric giảng viên nhập; điểm tối đa của bài = tổng điểm các tiêu chí. */
export function normalizeRubric(input: unknown): { rubric: RubricCriterion[]; maxScore: number } {
  if (!Array.isArray(input) || input.length === 0 || input.length > MAX_CRITERIA) {
    throw new BadRequestException(`Rubric phải có từ 1 đến ${MAX_CRITERIA} tiêu chí.`);
  }
  const rubric = input.map((raw, i) => {
    const row = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const points = Number(row.points);
    if (!Number.isFinite(points) || points <= 0 || points > 100) {
      throw new BadRequestException(`Điểm của tiêu chí ${i + 1} phải trong khoảng (0, 100].`);
    }
    return {
      criterion: text(row.criterion, 200, `Tên tiêu chí ${i + 1}`),
      description: text(row.description, 1000, `Mô tả tiêu chí ${i + 1}`, false),
      points: Math.round(points * 100) / 100,
    };
  });
  const maxScore = Math.round(rubric.reduce((sum, c) => sum + c.points, 0) * 100) / 100;
  return { rubric, maxScore };
}

export function normalizeProcessorInput(body: Record<string, unknown>) {
  return {
    title: text(body.title, 255, 'Tên bộ chấm'),
    instructions: text(body.instructions, 10000, 'Đề bài', false),
    visibleToOwner: body.visibleToOwner === true,
    ...normalizeRubric(body.rubric),
  };
}

export function essayGradingEvent(essaySubmissionId: string, courseId: string) {
  return {
    event_type: ESSAY_GRADING_REQUESTED,
    aggregate_type: 'essay_submission',
    aggregate_id: essaySubmissionId,
    payload: {
      essay_submission_id: essaySubmissionId,
      course_id: courseId,
    } as Prisma.InputJsonValue,
  };
}

/** Phần mở rộng tên file lưu MinIO, để worker chọn parser theo đuôi như tài liệu thường. */
export function assetExtension(asset: Pick<EssayAsset, 'title' | 'content_type'>) {
  const fromTitle = asset.title?.match(/\.([a-z0-9]{1,8})$/i)?.[1]?.toLowerCase();
  if (fromTitle) return `.${fromTitle}`;
  const type = (asset.content_type || '').split(';')[0].trim().toLowerCase();
  const byType: Record<string, string> = {
    'application/pdf': '.pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'text/html': '.html',
    'text/plain': '.txt',
    'text/markdown': '.md',
  };
  return byType[type] ?? '.bin';
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, '');
}

/** `result` của báo cáo Canvas tối đa 16 ký tự. */
export function resultText(score: number, max: number) {
  return `${formatPoints(score)}/${formatPoints(max)}`.slice(0, 16);
}

function indication(fraction: number) {
  if (fraction >= 0.8) return '#0B874B';
  if (fraction >= 0.5) return '#FC5E13';
  return '#E0061F';
}

export function reportComment(result: EssayResult, assetCount: number) {
  const lines = [
    `Điểm gợi ý ${resultText(result.score, result.max_score)} do AI chấm theo rubric; giảng viên quyết định điểm cuối.`,
    ...result.criteria.map(
      (c) => `• ${c.criterion}: ${formatPoints(c.points)}/${formatPoints(c.max_points)}${c.comment ? ` — ${c.comment}` : ''}`,
    ),
  ];
  if (result.feedback) lines.push(`Nhận xét: ${result.feedback}`);
  if (assetCount > 1) lines.push(`Chấm chung ${assetCount} file của lần nộp này.`);
  if (result.truncated) lines.push('Bài quá dài nên AI chỉ đọc phần đầu.');
  return lines.join('\n').slice(0, 4000);
}

type ReportBase = { assetId: string; timestamp: string };

export function processingReport(base: ReportBase) {
  return { ...base, type: REPORT_TYPE, title: REPORT_TITLE, priority: 0, processingProgress: 'Processing' };
}

export function gradedReport(
  base: ReportBase,
  result: EssayResult,
  options: { visibleToOwner: boolean; assetCount: number },
) {
  const fraction = result.max_score > 0 ? result.score / result.max_score : 0;
  return {
    ...base,
    type: REPORT_TYPE,
    title: REPORT_TITLE,
    result: resultText(result.score, result.max_score),
    comment: reportComment(result, options.assetCount),
    indicationColor: indication(fraction),
    indicationAlt: `Điểm gợi ý ${Math.round(fraction * 100)}%`,
    priority: 0,
    processingProgress: 'Processed',
    visibleToOwner: options.visibleToOwner,
  };
}

export function failedReport(base: ReportBase, errorCode: string, comment: string) {
  return {
    ...base,
    type: REPORT_TYPE,
    title: REPORT_TITLE,
    priority: 0,
    processingProgress: 'Failed',
    errorCode,
    comment,
  };
}
