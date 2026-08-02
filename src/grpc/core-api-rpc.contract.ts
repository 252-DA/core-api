import type { ContentGenerationService } from '../content-generation/content-generation.service';
import type { CourseService } from '../course/course.service';
import type { DocumentService } from '../document/document.service';
import type { LessonService } from '../lesson/lesson.service';
import type { LaunchSyncDto } from '../lti/dto/launch-sync.dto';
import type { LtiService } from '../lti/lti.service';
import type { QuizService } from '../quiz/quiz.service';
import type { ReviewService } from '../review/review.service';

export interface JsonRequestEnvelope {
  json?: string;
}

export interface JsonResponseEnvelope {
  json: string;
}

export type JsonPrimitive = boolean | number | string | null;
export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type EmptyRpcRequest = Record<string, never>;
export type LaunchSyncRequest = LaunchSyncDto & { email?: string };
export type CourseIdRequest = { courseId: string };
export type LessonIdRequest = { lessonId: string };

export interface CreateUploadSessionRequest {
  courseId: string;
  title: string;
  fileName: string;
  mimeType?: string;
  checksum?: string;
}

export interface ListDocumentsRequest extends CourseIdRequest {
  limit?: number;
  offset?: number;
}

export interface ListLessonsRequest extends CourseIdRequest {
  status?: string;
}

export interface LessonContentRequest extends LessonIdRequest {
  status?: string;
}

export interface ListReviewDraftsRequest extends CourseIdRequest {
  kind?: 'card' | 'quiz';
}

export interface CardIdRequest {
  cardId: string;
}

export interface RejectCardRequest extends CardIdRequest {
  reason?: string;
}

export interface UpdateCardRequest extends CardIdRequest {
  content: JsonValue;
}

export interface QuizIdRequest {
  quizId: string;
}

export interface RejectQuizItemRequest extends QuizIdRequest {
  reason?: string;
}

export interface QuizItemUpdate {
  question?: string;
  options?: JsonValue;
  correct_answer?: JsonValue;
  explanation?: string;
}

export interface UpdateQuizItemRequest extends QuizIdRequest {
  data: QuizItemUpdate;
}

export interface SubmitQuizRequest extends LessonIdRequest {
  resourceLinkId?: string;
  answers: Array<{
    quizId: string;
    chosenAnswer: JsonValue;
    responseTimeMs?: number;
  }>;
}

export interface CreateContentGenerationRequest extends CourseIdRequest {
  type: 'card' | 'quiz';
  scope: JsonObject;
}

type AwaitedReturn<T extends (...args: never[]) => unknown> = Awaited<
  ReturnType<T>
>;

interface RpcDefinition<TRequest, TResponse> {
  request: TRequest;
  response: TResponse;
}

export interface CoreRpcContract {
  LaunchSync: RpcDefinition<
    LaunchSyncRequest,
    AwaitedReturn<LtiService['syncLaunch']>
  >;
  ListCourses: RpcDefinition<
    EmptyRpcRequest,
    AwaitedReturn<CourseService['listCourses']>
  >;
  GetCourse: RpcDefinition<
    CourseIdRequest,
    AwaitedReturn<CourseService['getCourse']>
  >;
  ListChapters: RpcDefinition<
    CourseIdRequest,
    AwaitedReturn<CourseService['getChapters']>
  >;
  ListLearningOutcomes: RpcDefinition<
    CourseIdRequest,
    AwaitedReturn<CourseService['getLearningOutcomes']>
  >;
  CreateUploadSession: RpcDefinition<
    CreateUploadSessionRequest,
    AwaitedReturn<DocumentService['createUploadSession']>
  >;
  ConfirmUpload: RpcDefinition<
    { documentId: string },
    AwaitedReturn<DocumentService['confirmUpload']>
  >;
  ListDocuments: RpcDefinition<
    ListDocumentsRequest,
    AwaitedReturn<DocumentService['listDocuments']>
  >;
  DeleteDocument: RpcDefinition<
    { documentId: string },
    AwaitedReturn<DocumentService['deleteDocument']>
  >;
  ListLessons: RpcDefinition<
    ListLessonsRequest,
    AwaitedReturn<LessonService['list']>
  >;
  GetLesson: RpcDefinition<
    LessonIdRequest,
    AwaitedReturn<LessonService['get']>
  >;
  GetLessonCards: RpcDefinition<
    LessonContentRequest,
    AwaitedReturn<LessonService['cards']>
  >;
  GetLessonQuiz: RpcDefinition<
    LessonContentRequest,
    AwaitedReturn<LessonService['quiz']>
  >;
  PublishLesson: RpcDefinition<
    LessonIdRequest,
    AwaitedReturn<LessonService['publish']>
  >;
  ListReviewDrafts: RpcDefinition<
    ListReviewDraftsRequest,
    AwaitedReturn<ReviewService['listDrafts']>
  >;
  ApproveCard: RpcDefinition<
    CardIdRequest,
    AwaitedReturn<ReviewService['approveCard']>
  >;
  RejectCard: RpcDefinition<
    RejectCardRequest,
    AwaitedReturn<ReviewService['rejectCard']>
  >;
  UpdateCard: RpcDefinition<
    UpdateCardRequest,
    AwaitedReturn<ReviewService['updateCard']>
  >;
  ApproveQuizItem: RpcDefinition<
    QuizIdRequest,
    AwaitedReturn<ReviewService['approveQuizItem']>
  >;
  RejectQuizItem: RpcDefinition<
    RejectQuizItemRequest,
    AwaitedReturn<ReviewService['rejectQuizItem']>
  >;
  UpdateQuizItem: RpcDefinition<
    UpdateQuizItemRequest,
    AwaitedReturn<ReviewService['updateQuizItem']>
  >;
  SubmitQuiz: RpcDefinition<
    SubmitQuizRequest,
    AwaitedReturn<QuizService['submit']>
  >;
  ListQuizAttempts: RpcDefinition<
    LessonIdRequest,
    AwaitedReturn<QuizService['attempts']>
  >;
  CreateContentGenerationRequest: RpcDefinition<
    CreateContentGenerationRequest,
    AwaitedReturn<ContentGenerationService['createRequest']>
  >;
}

export type CoreRpcMethod = keyof CoreRpcContract;
export type CoreRpcRequest<TMethod extends CoreRpcMethod> =
  CoreRpcContract[TMethod]['request'];
export type CoreRpcResponse<TMethod extends CoreRpcMethod> =
  CoreRpcContract[TMethod]['response'];

const REQUIRED_STRING_FIELDS = {
  LaunchSync: ['lmsType', 'lmsSub', 'role', 'courseRole', 'lmsContextId'],
  ListCourses: [],
  GetCourse: ['courseId'],
  ListChapters: ['courseId'],
  ListLearningOutcomes: ['courseId'],
  CreateUploadSession: ['courseId', 'title', 'fileName'],
  ConfirmUpload: ['documentId'],
  ListDocuments: ['courseId'],
  DeleteDocument: ['documentId'],
  ListLessons: ['courseId'],
  GetLesson: ['lessonId'],
  GetLessonCards: ['lessonId'],
  GetLessonQuiz: ['lessonId'],
  PublishLesson: ['lessonId'],
  ListReviewDrafts: ['courseId'],
  ApproveCard: ['cardId'],
  RejectCard: ['cardId'],
  UpdateCard: ['cardId'],
  ApproveQuizItem: ['quizId'],
  RejectQuizItem: ['quizId'],
  UpdateQuizItem: ['quizId'],
  SubmitQuiz: ['lessonId'],
  ListQuizAttempts: ['lessonId'],
  CreateContentGenerationRequest: ['courseId', 'type'],
} as const satisfies Record<CoreRpcMethod, readonly string[]>;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireEnum(
  method: CoreRpcMethod,
  body: Record<string, unknown>,
  field: string,
  allowed: readonly string[],
): void {
  if (!allowed.includes(String(body[field]))) {
    throw new Error(`${method}.${field} must be one of: ${allowed.join(', ')}`);
  }
}

function parseJsonObject(rawJson: string | undefined): Record<string, unknown> {
  if (!rawJson) {
    return {};
  }

  const parsed: unknown = JSON.parse(rawJson);
  if (!isObject(parsed)) {
    throw new Error('gRPC JSON request body must be an object');
  }
  return parsed;
}

export function parseCoreRpcRequest<TMethod extends CoreRpcMethod>(
  method: TMethod,
  rawJson: string | undefined,
): CoreRpcRequest<TMethod> {
  const body = parseJsonObject(rawJson);

  for (const field of REQUIRED_STRING_FIELDS[method]) {
    const value = body[field];
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(`${method} requires a non-empty ${field}`);
    }
  }

  if (method === 'SubmitQuiz' && !Array.isArray(body.answers)) {
    throw new Error('SubmitQuiz requires an answers array');
  }
  if (method === 'SubmitQuiz' && Array.isArray(body.answers)) {
    for (const [index, answer] of body.answers.entries()) {
      if (!isObject(answer)) {
        throw new Error(`SubmitQuiz.answers[${index}] must be an object`);
      }
      if (typeof answer.quizId !== 'string' || !answer.quizId.trim()) {
        throw new Error(
          `SubmitQuiz.answers[${index}] requires a non-empty quizId`,
        );
      }
      if (!Object.prototype.hasOwnProperty.call(answer, 'chosenAnswer')) {
        throw new Error(`SubmitQuiz.answers[${index}] requires chosenAnswer`);
      }
    }
  }
  if (
    method === 'UpdateCard' &&
    !Object.prototype.hasOwnProperty.call(body, 'content')
  ) {
    throw new Error('UpdateCard requires content');
  }
  if (method === 'UpdateQuizItem' && !isObject(body.data)) {
    throw new Error('UpdateQuizItem requires a data object');
  }
  if (method === 'CreateContentGenerationRequest' && !isObject(body.scope)) {
    throw new Error('CreateContentGenerationRequest requires a scope object');
  }
  if (method === 'CreateContentGenerationRequest') {
    requireEnum(method, body, 'type', ['card', 'quiz']);
  }
  if (method === 'ListReviewDrafts' && body.kind !== undefined) {
    requireEnum(method, body, 'kind', ['card', 'quiz']);
  }
  if (method === 'LaunchSync') {
    requireEnum(method, body, 'lmsType', ['openedx', 'moodle', 'canvas']);
    requireEnum(method, body, 'role', [
      'instructor',
      'learner',
      'administrator',
    ]);
    requireEnum(method, body, 'courseRole', [
      'instructor',
      'learner',
      'ta',
      'observer',
    ]);
    if (body.targetKind !== undefined) {
      requireEnum(method, body, 'targetKind', [
        'lesson',
        'card',
        'quiz_set',
        'chat',
        'video',
      ]);
    }
    if (body.customClaims !== undefined && !isObject(body.customClaims)) {
      throw new Error('LaunchSync.customClaims must be an object');
    }
  }

  return body as CoreRpcRequest<TMethod>;
}
