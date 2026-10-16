import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '../auth/authz.service';
import type { BffClaims } from '../auth/bff-claims';
import { gradeAnswer } from '../quiz/question-types';
import { gradingInput, submissionScore } from '../quiz/answer-grading';

export type SubmitAnswerInput = {
  questionId: string;
  chosenAnswer: unknown;
};

@Injectable()
export class MicroContentAttemptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  /**
   * Cập nhật tiến độ xem video (heartbeat định kỳ ~10s từ client).
   * Chống tua gian lận: Chỉ cộng watched_ms dựa trên thời gian thực tế đã trôi qua.
   */
  async reportProgress(
    claims: BffClaims,
    input: { microContentId: string; positionMs: number },
  ) {
    const item = await this.prisma.micro_contents.findFirst({
      where: { micro_content_id: input.microContentId, deleted_at: null },
    });
    if (!item) {
      throw new NotFoundException('Micro content not found');
    }
    await this.authz.assertCourseAccess(claims, item.course_id, [
      'learner',
      'instructor',
      'ta',
      'admin',
    ]);

    const videoDurationMs = item.video_duration_ms || 60000;
    const now = new Date();

    const existing = await this.prisma.micro_content_progress.findUnique({
      where: {
        micro_content_id_user_id: {
          micro_content_id: input.microContentId,
          user_id: claims.sub,
        },
      },
    });

    let newWatchedMs = 0;
    let newMaxPosMs = input.positionMs;

    if (existing) {
      const realElapsedMs = Math.max(0, now.getTime() - (existing.updated_at?.getTime() || now.getTime()));
      // Cho phép dung sai 1.5x thời gian thực giữa 2 heartbeat (đề phòng mạng lag/delay)
      const maxAllowedIncrementMs = Math.round(realElapsedMs * 1.5);

      // Nếu client tua tiến vượt xa, chỉ tăng tối đa bằng maxAllowedIncrementMs
      const forwardDeltaMs = Math.max(0, input.positionMs - existing.max_position_ms);
      const actualIncrementMs = Math.min(maxAllowedIncrementMs, forwardDeltaMs > 0 ? forwardDeltaMs : realElapsedMs);

      newWatchedMs = Math.min(videoDurationMs, existing.watched_ms + actualIncrementMs);
      newMaxPosMs = Math.max(existing.max_position_ms, input.positionMs);
    } else {
      // Lần đầu tiên ghi nhận, tối đa 15 giây
      newWatchedMs = Math.min(15000, input.positionMs);
      newMaxPosMs = input.positionMs;
    }

    const saved = await this.prisma.micro_content_progress.upsert({
      where: {
        micro_content_id_user_id: {
          micro_content_id: input.microContentId,
          user_id: claims.sub,
        },
      },
      create: {
        micro_content_id: input.microContentId,
        user_id: claims.sub,
        max_position_ms: newMaxPosMs,
        watched_ms: newWatchedMs,
        updated_at: now,
      },
      update: {
        max_position_ms: newMaxPosMs,
        watched_ms: newWatchedMs,
        updated_at: now,
      },
    });

    const watchedPercent = Math.min(
      100,
      Math.round((saved.watched_ms / (videoDurationMs || 1)) * 100),
    );
    const unlocked =
      item.required_watch_percent === 0 || watchedPercent >= item.required_watch_percent;

    return {
      watchedPercent,
      watchedMs: saved.watched_ms,
      maxPositionMs: saved.max_position_ms,
      requiredWatchPercent: item.required_watch_percent,
      unlocked,
    };
  }

  /**
   * Nộp bài kiểm tra củng cố kiến thức:
   * 1. Kiểm tra quyền learner và trạng thái PUBLISHED.
   * 2. Bắt buộc xem đủ thời lượng video (server-side validation).
   * 3. Chấm điểm 4 loại câu hỏi ngay lập tức; câu tự luận đánh dấu PENDING.
   * 4. Ghi attempt và answers trong một transaction.
   * 5. Chỉ trả về đáp án và giải thích sau khi đã nộp bài thành công.
   */
  async submit(
    claims: BffClaims,
    input: { microContentId: string; answers: SubmitAnswerInput[] },
  ) {
    const item = await this.prisma.micro_contents.findFirst({
      where: { micro_content_id: input.microContentId, deleted_at: null },
    });
    if (!item) {
      throw new NotFoundException('Micro content not found');
    }
    if (item.status !== 'PUBLISHED') {
      throw new BadRequestException('Micro content chưa được xuất bản.');
    }
    await this.authz.assertCourseAccess(claims, item.course_id, ['learner']);

    // 1. Kiểm tra điều kiện xem video phía server
    if (item.required_watch_percent > 0) {
      const progress = await this.prisma.micro_content_progress.findUnique({
        where: {
          micro_content_id_user_id: {
            micro_content_id: input.microContentId,
            user_id: claims.sub,
          },
        },
      });

      const videoDurationMs = item.video_duration_ms || 60000;
      const watchedPercent = progress
        ? Math.min(100, Math.round((progress.watched_ms / videoDurationMs) * 100))
        : 0;

      if (watchedPercent < item.required_watch_percent) {
        throw new BadRequestException(
          `Bạn cần xem ít nhất ${item.required_watch_percent}% thời lượng video để nộp bài. Hiện tại bạn đã xem ${watchedPercent}%.`,
        );
      }
    }

    // 2. Tải tất cả câu hỏi của bài học
    const questions = await this.prisma.micro_content_questions.findMany({
      where: { micro_content_id: input.microContentId, deleted_at: null },
      orderBy: { position: 'asc' },
    });

    if (questions.length === 0) {
      throw new BadRequestException('Bài học này chưa có câu hỏi nào.');
    }

    const answerMap = new Map(input.answers.map((a) => [a.questionId, a.chosenAnswer]));
    if (questions.length !== input.answers.length || questions.some((q) => !answerMap.has(q.question_id))) {
      throw new BadRequestException('Vui lòng trả lời đầy đủ tất cả các câu hỏi.');
    }

    // 3. Chấm từng câu hỏi
    const gradedList = questions.map((q) => {
      const chosen = answerMap.get(q.question_id);
      const grade = gradeAnswer(
        { type: q.type, correct_answer: q.correct_answer },
        chosen,
      );

      const isEssay = q.type === 'SHORT_ANSWER';
      const essayGradingInput = isEssay
        ? gradingInput({
            type: q.type,
            question: q.question,
            correct_answer: q.correct_answer,
          })
        : null;

      return {
        questionId: q.question_id,
        position: q.position,
        type: q.type,
        question: q.question,
        options: q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        chosenAnswer: chosen,
        score: grade.score,
        isCorrect: grade.isCorrect,
        pending: grade.pending,
        gradingStatus: grade.pending ? 'PENDING' : 'GRADED',
        gradingInput: essayGradingInput,
      };
    });

    const totalScore = submissionScore(gradedList.map((g) => g.score));
    const passed = totalScore >= item.passing_score;
    const hasPending = gradedList.some((g) => g.pending);
    const overallGradingStatus = hasPending ? 'PENDING' : 'GRADED';

    // 4. Lưu lượt nộp và kết quả vào DB trọn gói
    const attempt = await this.prisma.$transaction(async (tx) => {
      const createdAttempt = await tx.micro_content_attempts.create({
        data: {
          micro_content_id: input.microContentId,
          user_id: claims.sub,
          score: totalScore,
          passed,
          grading_status: overallGradingStatus,
          submitted_at: new Date(),
        },
      });

      const createdPendingAnswerIds: string[] = [];
      for (const g of gradedList) {
        const createdAns = await tx.micro_content_answers.create({
          data: {
            attempt_id: createdAttempt.attempt_id,
            question_id: g.questionId,
            chosen_answer: g.chosenAnswer as Prisma.InputJsonValue,
            score: g.score,
            is_correct: g.isCorrect,
            grading_status: g.gradingStatus,
            grading_input: g.gradingInput as Prisma.InputJsonValue,
          },
        });
        if (g.pending) {
          createdPendingAnswerIds.push(createdAns.answer_id);
        }
      }

      if (hasPending && createdPendingAnswerIds.length > 0) {
        await tx.outbox_events.create({
          data: {
            event_type: 'MICRO_CONTENT_GRADING_REQUESTED',
            aggregate_type: 'micro_content_attempt',
            aggregate_id: createdAttempt.attempt_id,
            payload: {
              attempt_id: createdAttempt.attempt_id,
              course_id: item.course_id,
              micro_content_id: item.micro_content_id,
              answer_ids: createdPendingAnswerIds,
            },
          },
        });
      }

      return createdAttempt;
    });

    // 5. Trả kết quả chi tiết kèm đáp án và giải thích cho từng câu
    return {
      attemptId: attempt.attempt_id,
      score: totalScore,
      passed,
      passingScore: item.passing_score,
      gradingStatus: overallGradingStatus,
      submittedAt: attempt.submitted_at,
      questions: gradedList.map((g) => ({
        questionId: g.questionId,
        position: g.position,
        type: g.type,
        question: g.question,
        options: g.options,
        chosenAnswer: g.chosenAnswer,
        correctAnswer: g.correctAnswer,
        explanation: g.explanation,
        score: g.score,
        isCorrect: g.isCorrect,
        gradingStatus: g.gradingStatus,
      })),
    };
  }

  /**
   * Lấy kết quả của một attempt cụ thể.
   */
  async getResult(claims: BffClaims, input: { attemptId: string }) {
    const attempt = await this.prisma.micro_content_attempts.findUnique({
      where: { attempt_id: input.attemptId },
      include: {
        micro_contents: true,
        answers: {
          include: { question: true },
          orderBy: { question: { position: 'asc' } },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Không tìm thấy kết quả lượt làm bài.');
    }

    const isOwner = attempt.user_id === claims.sub;
    const isStaff =
      claims.scope === 'admin' ||
      claims.roles?.some((r) => ['instructor', 'ta', 'admin', 'teacher'].includes(r));

    if (!isOwner && !isStaff) {
      throw new ForbiddenException('Bạn không có quyền xem kết quả này.');
    }

    return {
      attemptId: attempt.attempt_id,
      microContentId: attempt.micro_content_id,
      score: attempt.score,
      passed: attempt.passed,
      passingScore: attempt.micro_contents.passing_score,
      gradingStatus: attempt.grading_status,
      submittedAt: attempt.submitted_at,
      questions: attempt.answers.map((a) => ({
        questionId: a.question_id,
        position: a.question.position,
        type: a.question.type,
        question: a.question.question,
        options: a.question.options,
        chosenAnswer: a.chosen_answer,
        correctAnswer: a.question.correct_answer,
        explanation: a.question.explanation,
        score: a.score,
        isCorrect: a.is_correct,
        gradingStatus: a.grading_status,
        feedback: a.feedback,
      })),
    };
  }

  /**
   * Lịch sử các lần làm bài của người học (làm lại không giới hạn).
   */
  async listAttempts(claims: BffClaims, input: { microContentId: string }) {
    const isStaff =
      claims.scope === 'admin' ||
      claims.roles?.some((r) => ['instructor', 'ta', 'admin', 'teacher'].includes(r));

    const attempts = await this.prisma.micro_content_attempts.findMany({
      where: {
        micro_content_id: input.microContentId,
        ...(!isStaff ? { user_id: claims.sub } : {}),
      },
      orderBy: { submitted_at: 'desc' },
      select: {
        attempt_id: true,
        score: true,
        passed: true,
        grading_status: true,
        submitted_at: true,
        user_id: true,
      },
    });

    return { attempts };
  }
}
