import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthzService } from '../auth/authz.service';
import type { BffClaims } from '../auth/bff-claims';
import { isQuestionType, normalizeAnswerKey } from '../quiz/question-types';

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
};

export type UpdateMicroContentInput = {
  microContentId: string;
  title?: string;
  description?: string;
  passingScore?: number;
  requiredWatchPercent?: number;
  aiPrompt?: string;
  aiOptions?: unknown;
};

@Injectable()
export class MicroContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthzService,
  ) {}

  /**
   * Danh sách Micro Content theo khoá học cho giảng viên / TA.
   */
  async list(claims: BffClaims, courseId: string) {
    await this.authz.assertCourseAccess(claims, courseId, ['instructor', 'ta', 'admin']);

    const items = await this.prisma.micro_contents.findMany({
      where: {
        course_id: courseId,
        deleted_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
      include: {
        _count: {
          select: {
            questions: {
              where: { deleted_at: null },
            },
            attempts: true,
          },
        },
      },
    });

    return items.map((item) => ({
      id: item.micro_content_id,
      courseId: item.course_id,
      title: item.title,
      description: item.description,
      videoSource: item.video_source,
      videoStatus: item.video_status,
      videoDurationMs: item.video_duration_ms,
      videoError: item.video_error,
      passingScore: item.passing_score,
      requiredWatchPercent: item.required_watch_percent,
      status: item.status,
      questionCount: item._count.questions,
      attemptCount: item._count.attempts,
      createdAt: item.created_at,
      updated_at: item.updated_at,
    }));
  }

  /**
   * Lấy chi tiết Micro Content kèm câu hỏi.
   * QUAN TRỌNG: Với learner, KHÔNG trả về correct_answer và explanation.
   */
  async get(claims: BffClaims, microContentId: string) {
    const item = await this.prisma.micro_contents.findFirst({
      where: {
        micro_content_id: microContentId,
        deleted_at: null,
      },
      include: {
        questions: {
          where: { deleted_at: null },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Micro content not found');
    }

    const isStaff =
      claims.scope === 'admin' ||
      claims.roles?.some((r) => ['instructor', 'ta', 'admin', 'teacher'].includes(r));

    if (!isStaff) {
      // Learner chỉ được xem nếu nội dung đã PUBLISHED
      if (item.status !== 'PUBLISHED') {
        throw new NotFoundException('Micro content not found');
      }
      await this.authz.assertCourseAccess(claims, item.course_id, ['learner']);

      // Ẩn đáp án đúng và giải thích đối với học viên
      const sanitizedQuestions = item.questions.map((q) => ({
        id: q.question_id,
        position: q.position,
        type: q.type,
        question: q.question,
        options: q.options,
      }));

      return {
        id: item.micro_content_id,
        courseId: item.course_id,
        title: item.title,
        description: item.description,
        videoSource: item.video_source,
        videoStatus: item.video_status,
        videoDurationMs: item.video_duration_ms,
        passingScore: item.passing_score,
        requiredWatchPercent: item.required_watch_percent,
        status: item.status,
        questions: sanitizedQuestions,
      };
    }

    // Giảng viên / TA / Admin xem được toàn bộ
    await this.authz.assertCourseAccess(claims, item.course_id, ['instructor', 'ta', 'admin']);

    return {
      id: item.micro_content_id,
      courseId: item.course_id,
      title: item.title,
      description: item.description,
      videoSource: item.video_source,
      videoStatus: item.video_status,
      videoDurationMs: item.video_duration_ms,
      videoError: item.video_error,
      aiPrompt: item.ai_prompt,
      aiOptions: item.ai_options,
      aiScript: item.ai_script,
      passingScore: item.passing_score,
      requiredWatchPercent: item.required_watch_percent,
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      questions: item.questions.map((q) => ({
        id: q.question_id,
        position: q.position,
        type: q.type,
        question: q.question,
        options: q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
      })),
    };
  }

  /**
   * Tạo Micro Content mới (mặc định DRAFT).
   */
  async create(claims: BffClaims, input: CreateMicroContentInput) {
    await this.authz.assertCourseAccess(claims, input.courseId, ['instructor', 'ta', 'admin']);

    if (!input.title?.trim()) {
      throw new BadRequestException('Tiêu đề không được để trống.');
    }

    const created = await this.prisma.micro_contents.create({
      data: {
        course_id: input.courseId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        video_source: input.videoSource || 'UPLOAD',
        video_status: 'NONE',
        passing_score: input.passingScore ?? 70,
        required_watch_percent: input.requiredWatchPercent ?? 90,
        status: 'DRAFT',
        created_by: claims.sub,
      },
    });

    return {
      id: created.micro_content_id,
      courseId: created.course_id,
      title: created.title,
      status: created.status,
    };
  }

  /**
   * Cập nhật thông tin Micro Content.
   */
  async update(claims: BffClaims, input: UpdateMicroContentInput) {
    const item = await this.prisma.micro_contents.findFirst({
      where: { micro_content_id: input.microContentId, deleted_at: null },
    });
    if (!item) {
      throw new NotFoundException('Micro content not found');
    }
    await this.authz.assertCourseAccess(claims, item.course_id, ['instructor', 'ta', 'admin']);

    const updated = await this.prisma.micro_contents.update({
      where: { micro_content_id: input.microContentId },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description.trim() || null } : {}),
        ...(input.passingScore !== undefined ? { passing_score: input.passingScore } : {}),
        ...(input.requiredWatchPercent !== undefined
          ? { required_watch_percent: input.requiredWatchPercent }
          : {}),
        ...(input.aiPrompt !== undefined ? { ai_prompt: input.aiPrompt } : {}),
        ...(input.aiOptions !== undefined ? { ai_options: input.aiOptions as any } : {}),
        updated_at: new Date(),
      },
    });

    return {
      id: updated.micro_content_id,
      title: updated.title,
      description: updated.description,
      passingScore: updated.passing_score,
      requiredWatchPercent: updated.required_watch_percent,
    };
  }

  /**
   * Xoá mềm Micro Content.
   */
  async delete(claims: BffClaims, microContentId: string) {
    const item = await this.prisma.micro_contents.findFirst({
      where: { micro_content_id: microContentId, deleted_at: null },
    });
    if (!item) {
      throw new NotFoundException('Micro content not found');
    }
    await this.authz.assertCourseAccess(claims, item.course_id, ['instructor', 'ta', 'admin']);

    await this.prisma.micro_contents.update({
      where: { micro_content_id: microContentId },
      data: { deleted_at: new Date() },
    });

    return { success: true };
  }

  /**
   * Xuất bản hoặc thu hồi xuất bản.
   * Chỉ được xuất bản khi video_status = READY và có ít nhất 1 câu hỏi.
   */
  async publish(claims: BffClaims, microContentId: string, targetStatus?: 'DRAFT' | 'PUBLISHED') {
    const item = await this.prisma.micro_contents.findFirst({
      where: { micro_content_id: microContentId, deleted_at: null },
      include: {
        _count: {
          select: {
            questions: { where: { deleted_at: null } },
          },
        },
      },
    });
    if (!item) {
      throw new NotFoundException('Micro content not found');
    }
    await this.authz.assertCourseAccess(claims, item.course_id, ['instructor', 'ta', 'admin']);

    const newStatus = targetStatus ?? (item.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED');

    if (newStatus === 'PUBLISHED') {
      if (item.video_status !== 'READY') {
        throw new BadRequestException('Chỉ có thể xuất bản khi video đã sẵn sàng (READY).');
      }
      if (item._count.questions === 0) {
        throw new BadRequestException('Phải có ít nhất 1 câu hỏi để xuất bản.');
      }
    }

    const updated = await this.prisma.micro_contents.update({
      where: { micro_content_id: microContentId },
      data: {
        status: newStatus,
        updated_at: new Date(),
      },
    });

    return {
      id: updated.micro_content_id,
      status: updated.status,
    };
  }

  /**
   * Lưu toàn bộ danh sách câu hỏi trong một transaction.
   * Bắt buộc kiểm tra và chuẩn hoá từng câu qua `normalizeAnswerKey`.
   */
  async saveQuestions(
    claims: BffClaims,
    input: { microContentId: string; questions: QuestionInput[] },
  ) {
    const item = await this.prisma.micro_contents.findFirst({
      where: { micro_content_id: input.microContentId, deleted_at: null },
    });
    if (!item) {
      throw new NotFoundException('Micro content not found');
    }
    await this.authz.assertCourseAccess(claims, item.course_id, ['instructor', 'ta', 'admin']);

    // 1. Kiểm tra và chuẩn hoá từng câu hỏi trước khi mở transaction
    const normalizedList = input.questions.map((q, idx) => {
      const position = q.position ?? idx + 1;
      const questionText = q.question?.trim();
      if (!questionText) {
        throw new BadRequestException(`Câu hỏi ở vị trí ${position} không được để trống nội dung.`);
      }
      if (!isQuestionType(q.type)) {
        throw new BadRequestException(`Kiểu câu hỏi '${q.type}' không hợp lệ.`);
      }

      const normalized = normalizeAnswerKey(q.type, questionText, {
        options: q.options,
        correct_answer: q.correctAnswer,
      });

      return {
        id: q.id,
        position,
        type: q.type,
        question: questionText,
        options: normalized.options as any,
        correctAnswer: normalized.correct_answer as any,
        explanation: q.explanation?.trim() || null,
      };
    });

    // 2. Ghi đè câu hỏi trong transaction
    await this.prisma.$transaction(async (tx) => {
      // Đánh dấu deleted_at cho các câu hỏi cũ không còn trong danh sách hoặc xoá mềm toàn bộ
      await tx.micro_content_questions.updateMany({
        where: {
          micro_content_id: input.microContentId,
          deleted_at: null,
        },
        data: {
          deleted_at: new Date(),
        },
      });

      // Tạo mới toàn bộ danh sách đã chuẩn hoá
      for (const q of normalizedList) {
        await tx.micro_content_questions.create({
          data: {
            micro_content_id: input.microContentId,
            position: q.position,
            type: q.type,
            question: q.question,
            options: q.options,
            correct_answer: q.correctAnswer,
            explanation: q.explanation,
          },
        });
      }

      await tx.micro_contents.update({
        where: { micro_content_id: input.microContentId },
        data: { updated_at: new Date() },
      });
    });

    return {
      success: true,
      savedCount: normalizedList.length,
    };
  }

  // Placeholder methods for upcoming milestones (M2-M5)
  async createUpload(claims: BffClaims, _body: { microContentId: string; filename: string }) {
    return { uploadUrl: '', objectKey: '' };
  }

  async confirmUpload(claims: BffClaims, _body: { microContentId: string }) {
    return { success: true };
  }

  async getVideoUrl(claims: BffClaims, _body: { microContentId: string }) {
    return { url: '' };
  }

  async requestScript(claims: BffClaims, _body: unknown) {
    return { success: true };
  }

  async saveScript(claims: BffClaims, _body: unknown) {
    return { success: true };
  }

  async requestRender(claims: BffClaims, _body: { microContentId: string }) {
    return { success: true };
  }

  async reportProgress(claims: BffClaims, _body: unknown) {
    return { watchedPercent: 0, unlocked: false };
  }

  async submit(claims: BffClaims, _body: unknown) {
    return { attemptId: '', score: 0, passed: false };
  }

  async getResult(claims: BffClaims, _body: { attemptId: string }) {
    return { attemptId: '', score: 0, passed: false };
  }

  async listAttempts(claims: BffClaims, _body: { microContentId: string }) {
    return { attempts: [] };
  }
}
