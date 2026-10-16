import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '../auth/authz.service';
import { AGS_STATUS } from '../ags/ags-status';
import type { BffClaims } from '../auth/bff-claims';
import { gradeAnswer } from './question-types';
import {
  answerGradingEvent,
  GRADING_STATUS,
  gradingInput,
  rowAgsStatus,
  submissionScore,
} from './answer-grading';

@Injectable()
export class QuizService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  async submit(
    claims: BffClaims,
    body: {
      lessonId: string;
      resourceLinkId?: string;
      answers: Array<{ quizId: string; chosenAnswer: unknown; responseTimeMs?: number }>;
    },
  ) {
    const lesson = await this.prisma.lessons.findFirst({
      where: { lesson_id: body.lessonId, deleted_at: null },
    });
    if (!lesson) {
      throw new BadRequestException('Lesson not found');
    }
    await this.authz.assertCourseAccess(claims, lesson.course_id, ['learner']);

    const quizIds = body.answers.map((answer) => answer.quizId);
    const quizItems = await this.prisma.quiz_items.findMany({
      where: {
        lesson_id: body.lessonId,
        quiz_id: { in: quizIds },
        status: 'PUBLISHED',
        deleted_at: null,
      },
    });
    const quizById = new Map(quizItems.map((item) => [item.quiz_id, item]));
    if (quizItems.length !== body.answers.length) {
      throw new BadRequestException('Some quiz items are not published or do not exist');
    }

    // AgsPublisherService gom mọi dòng PENDING của cùng (user, resource link)
    // thành một điểm để đẩy lên LMS, nên cả lượt nộp phải vào DB trọn gói —
    // ghi dở dang sẽ khiến sổ điểm nhận một điểm tính trên thiếu câu.
    const agsStatus = body.resourceLinkId
      ? AGS_STATUS.pending
      : AGS_STATUS.notRequired;

    let totalCorrect = 0;
    const perItem = [];
    const rows: Array<
      Prisma.quiz_attemptsCreateManyInput & {
        attempt_id: string;
        grading_status: string;
        ags_status: string;
      }
    > = [];
    for (const answer of body.answers) {
      const quiz = quizById.get(answer.quizId);
      if (!quiz) {
        continue;
      }
      const grade = gradeAnswer(quiz, answer.chosenAnswer);
      if (grade.isCorrect) {
        totalCorrect += 1;
      }
      rows.push({
        attempt_id: randomUUID(),
        user_id: claims.sub,
        quiz_id: quiz.quiz_id,
        course_id: quiz.course_id,
        resource_link_id: body.resourceLinkId,
        score: grade.score,
        chosen_answer: answer.chosenAnswer as any,
        is_correct: grade.isCorrect,
        grading_status: grade.pending ? GRADING_STATUS.pending : GRADING_STATUS.graded,
        // Đề đúng như lúc nộp: giảng viên sửa câu sau đó không đổi cách chấm bài này.
        ...(grade.pending ? { grading_input: gradingInput(quiz) } : {}),
        response_time_ms: answer.responseTimeMs,
        feedback: quiz.explanation,
        ags_status: agsStatus,
      });
      perItem.push({
        quizId: quiz.quiz_id,
        type: quiz.type,
        isCorrect: grade.isCorrect,
        score: grade.score,
        pending: grade.pending,
        feedback: quiz.explanation,
        correctAnswer: quiz.correct_answer,
      });
    }

    const essays = rows.filter((row) => row.grading_status === GRADING_STATUS.pending);
    const rowStatus = rowAgsStatus(agsStatus, essays.length > 0);
    for (const row of rows) row.ags_status = rowStatus;
    if (rows.length) {
      await this.prisma.$transaction(async (tx) => {
        await tx.quiz_attempts.createMany({ data: rows });
        if (essays.length) {
          await tx.outbox_events.create({
            data: answerGradingEvent({
              // Lesson quiz không có submission_id: id này chỉ gom một lượt
              // nộp cho worker chấm.
              submissionId: randomUUID(),
              courseId: lesson.course_id,
              attemptIds: rows.map((row) => row.attempt_id),
              essayAttemptIds: essays.map((row) => row.attempt_id),
            }),
          });
        }
      });
    }

    return {
      score: submissionScore(perItem.map((item) => item.score)),
      totalCorrect,
      total: body.answers.length,
      pendingCount: essays.length,
      perItem,
      // Việc đẩy điểm là bất đồng bộ nên tại thời điểm trả lời chưa bao giờ
      // publish xong; `agsStatus` cho client biết có đang xếp hàng hay không.
      agsPublished: false,
      agsStatus: rowStatus,
    };
  }

  async attempts(claims: BffClaims, lessonId: string) {
    const lesson = await this.prisma.lessons.findFirst({
      where: { lesson_id: lessonId, deleted_at: null },
    });
    if (!lesson) {
      throw new BadRequestException('Lesson not found');
    }
    await this.authz.assertCourseAccess(claims, lesson.course_id);
    return this.prisma.quiz_attempts.findMany({
      where: {
        user_id: claims.sub,
        quiz_items: { lesson_id: lessonId },
        deleted_at: null,
      },
      orderBy: { attempted_at: 'desc' },
      include: { quiz_items: true },
    });
  }
}
