import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '../auth/authz.service';
import { AGS_STATUS } from '../ags/ags-status';
import type { BffClaims } from '../auth/bff-claims';

function canonical(value: unknown) {
  return JSON.stringify(value);
}

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
    const rows = [];
    for (const answer of body.answers) {
      const quiz = quizById.get(answer.quizId);
      if (!quiz) {
        continue;
      }
      const isCorrect = canonical(answer.chosenAnswer) === canonical(quiz.correct_answer);
      if (isCorrect) {
        totalCorrect += 1;
      }
      rows.push({
        user_id: claims.sub,
        quiz_id: quiz.quiz_id,
        course_id: quiz.course_id,
        resource_link_id: body.resourceLinkId,
        score: isCorrect ? 100 : 0,
        chosen_answer: answer.chosenAnswer as any,
        is_correct: isCorrect,
        response_time_ms: answer.responseTimeMs,
        feedback: quiz.explanation,
        ags_status: agsStatus,
      });
      perItem.push({
        quizId: quiz.quiz_id,
        isCorrect,
        feedback: quiz.explanation,
        correctAnswer: quiz.correct_answer,
      });
    }

    if (rows.length) {
      await this.prisma.quiz_attempts.createMany({ data: rows });
    }

    return {
      score: body.answers.length ? Math.round((totalCorrect / body.answers.length) * 100) : 0,
      totalCorrect,
      total: body.answers.length,
      perItem,
      // Việc đẩy điểm là bất đồng bộ nên tại thời điểm trả lời chưa bao giờ
      // publish xong; `agsStatus` cho client biết có đang xếp hàng hay không.
      agsPublished: false,
      agsStatus,
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
