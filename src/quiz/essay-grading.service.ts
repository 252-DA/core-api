import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '../auth/authz.service';
import type { BffClaims } from '../auth/bff-claims';
import {
  answerGradingEvent,
  GRADING_STATUS,
  lockAwaitingGroup,
  releaseIfGraded,
} from './answer-grading';

const STAFF = ['instructor', 'ta'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_FEEDBACK = 2000;

/**
 * Câu tự luận AI không chấm được (grading_status NEEDS_REVIEW). Giảng viên chấm
 * tay hoặc cho AI chấm lại; trong lúc đó cả lượt nộp giữ AWAITING_GRADE, nên
 * lỗi của nhà cung cấp model không thành một điểm 0 trên sổ điểm LMS.
 */
@Injectable()
export class EssayGradingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  async list(claims: BffClaims, body: { courseId: string }) {
    await this.authz.assertCourseAccess(claims, body.courseId, STAFF);
    const rows = await this.prisma.quiz_attempts.findMany({
      where: {
        course_id: body.courseId,
        grading_status: GRADING_STATUS.needsReview,
        deleted_at: null,
      },
      orderBy: { attempted_at: 'asc' },
      take: 200,
      select: {
        attempt_id: true,
        submission_id: true,
        chosen_answer: true,
        grading_input: true,
        attempted_at: true,
        lms_user_mappings: { select: { display_name: true } },
        lti_resource_links: { select: { target_kind: true, target_id: true } },
      },
    });
    const targets = (kind: string) => [
      ...new Set(
        rows.flatMap((r) =>
          r.lti_resource_links?.target_kind === kind && r.lti_resource_links.target_id
            ? [r.lti_resource_links.target_id]
            : [],
        ),
      ),
    ];
    const [sets, lessons] = await Promise.all([
      this.prisma.quiz_sets.findMany({
        where: { quiz_set_id: { in: targets('quiz_set') } },
        select: { quiz_set_id: true, title: true },
      }),
      this.prisma.lessons.findMany({
        where: { lesson_id: { in: targets('lesson') } },
        select: { lesson_id: true, title: true },
      }),
    ]);
    const titles = new Map<string, string>([
      ...sets.map((s) => [s.quiz_set_id, s.title] as [string, string]),
      ...lessons.map((l) => [l.lesson_id, l.title] as [string, string]),
    ]);
    return rows.map((row) => ({
      attemptId: row.attempt_id,
      submissionId: row.submission_id,
      attemptedAt: row.attempted_at?.toISOString() ?? null,
      student: row.lms_user_mappings.display_name ?? 'Sinh viên',
      assignment: titles.get(row.lti_resource_links?.target_id ?? '') ?? null,
      answer: row.chosen_answer,
      // Đề lúc người học làm bài. Thiếu thì chỉ chấm tay được.
      gradingInput: row.grading_input,
    }));
  }

  async grade(
    claims: BffClaims,
    body: { attemptId: string; score: unknown; feedback?: unknown },
  ) {
    // Number('') và Number(null) là 0: ô điểm bỏ trống không được thành 0 điểm.
    const score =
      typeof body.score === 'number' ||
      (typeof body.score === 'string' && body.score.trim() !== '')
        ? Number(body.score)
        : NaN;
    if (!Number.isInteger(score) || score < 0 || score > 100)
      throw new BadRequestException('Điểm phải là số nguyên từ 0 đến 100.');
    const feedback =
      typeof body.feedback === 'string' ? body.feedback.trim().slice(0, MAX_FEEDBACK) : '';
    const attempt = await this.findAttempt(claims, body.attemptId);
    return this.prisma.$transaction(async (tx) => {
      const group = await lockAwaitingGroup(tx, attempt);
      const { count } = await tx.quiz_attempts.updateMany({
        where: {
          attempt_id: attempt.attempt_id,
          grading_status: GRADING_STATUS.needsReview,
          deleted_at: null,
        },
        data: {
          score,
          is_correct: score === 100,
          feedback: feedback || null,
          grading_status: GRADING_STATUS.graded,
        },
      });
      if (count !== 1)
        throw new ConflictException('Câu này đã được chấm hoặc đang được AI chấm lại.');
      await tx.review_audit_logs.create({
        data: {
          action: 'GRADE_ANSWER',
          entity_type: 'quiz_attempt',
          entity_id: attempt.attempt_id,
          performed_by: claims.sub,
          raw_changes: {
            before: { grading_status: attempt.grading_status, feedback: attempt.feedback },
            after: {
              grading_status: GRADING_STATUS.graded,
              score,
              feedback: feedback || null,
            },
          },
        },
      });
      const released = await releaseIfGraded(tx, group);
      return { attemptId: attempt.attempt_id, score, released };
    });
  }

  /** Nhà cung cấp model đã ổn lại: giao câu này cho worker chấm thêm một lượt. */
  async retry(claims: BffClaims, body: { attemptId: string }) {
    const attempt = await this.findAttempt(claims, body.attemptId);
    if (!attempt.grading_input)
      throw new BadRequestException(
        'Bài làm này không lưu đề lúc nộp nên AI không chấm lại được. Hãy chấm tay.',
      );
    return this.prisma.$transaction(async (tx) => {
      const group = await lockAwaitingGroup(tx, attempt);
      const { count } = await tx.quiz_attempts.updateMany({
        where: {
          attempt_id: attempt.attempt_id,
          grading_status: GRADING_STATUS.needsReview,
          deleted_at: null,
        },
        data: { grading_status: GRADING_STATUS.pending },
      });
      if (count !== 1)
        throw new ConflictException('Câu này đã được chấm hoặc đang được AI chấm lại.');
      await tx.outbox_events.create({
        data: answerGradingEvent({
          // Lesson quiz không có submission_id: id này chỉ gom việc cho worker.
          submissionId: attempt.submission_id ?? randomUUID(),
          courseId: attempt.course_id,
          // Worker mở khoá AGS cho cả nhóm khi chấm xong câu cuối.
          attemptIds: group.includes(attempt.attempt_id) ? group : [attempt.attempt_id],
          essayAttemptIds: [attempt.attempt_id],
        }),
      });
      await tx.review_audit_logs.create({
        data: {
          action: 'RETRY_ANSWER_GRADING',
          entity_type: 'quiz_attempt',
          entity_id: attempt.attempt_id,
          performed_by: claims.sub,
          raw_changes: {
            before: { grading_status: attempt.grading_status },
            after: { grading_status: GRADING_STATUS.pending },
          },
        },
      });
      return { attemptId: attempt.attempt_id, gradingStatus: GRADING_STATUS.pending };
    });
  }

  private async findAttempt(claims: BffClaims, attemptId: string) {
    if (typeof attemptId !== 'string' || !UUID.test(attemptId))
      throw new BadRequestException('Mã bài làm không hợp lệ.');
    const attempt = await this.prisma.quiz_attempts.findFirst({
      where: { attempt_id: attemptId, deleted_at: null },
      select: {
        attempt_id: true,
        submission_id: true,
        user_id: true,
        course_id: true,
        resource_link_id: true,
        grading_status: true,
        grading_input: true,
        feedback: true,
      },
    });
    if (!attempt) throw new NotFoundException('Không tìm thấy bài làm.');
    await this.authz.assertCourseAccess(claims, attempt.course_id, STAFF);
    return attempt;
  }
}
