import { HttpException, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { resolve } from 'path';
import { BffJwtService } from '../auth/bff-jwt.service';
import type { BffClaims } from '../auth/bff-claims';
import { LtiService } from '../lti/lti.service';
import { CourseService } from '../course/course.service';
import { DocumentService } from '../document/document.service';
import { LessonService } from '../lesson/lesson.service';
import { ReviewService } from '../review/review.service';
import { QuizService } from '../quiz/quiz.service';
import { QuizSetService } from '../quiz/quiz-set.service';
import { ContentGenerationService } from '../content-generation/content-generation.service';
import { CurriculumImportService } from '../curriculum/curriculum-import.service';
import { CanvasDocumentSyncService } from '../document/canvas-document-sync.service';

type JsonRequest = { json?: string };
type JsonResponse = { json: string };
type EmptyRequest = Record<string, never>;
type UnaryCall<T> = grpc.ServerUnaryCall<T, JsonResponse>;
type UnaryCallback = grpc.sendUnaryData<JsonResponse>;

@Injectable()
export class GrpcServerService implements OnModuleInit, OnModuleDestroy {
  private server?: grpc.Server;

  constructor(
    private readonly jwt: BffJwtService,
    private readonly lti: LtiService,
    private readonly courses: CourseService,
    private readonly documents: DocumentService,
    private readonly lessons: LessonService,
    private readonly review: ReviewService,
    private readonly quiz: QuizService,
    private readonly quizSets: QuizSetService,
    private readonly contentGeneration: ContentGenerationService,
    private readonly curriculumImports: CurriculumImportService,
    private readonly canvasDocuments: CanvasDocumentSyncService,
  ) {}

  async onModuleInit() {
    const protoPath = resolve(process.cwd(), 'proto/core_api.proto');
    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });
    const loaded = grpc.loadPackageDefinition(packageDefinition) as any;
    const service = loaded.ai_lms?.v1?.CoreApiService?.service;
    if (!service) {
      throw new Error('CoreApiService not found in proto definition');
    }

    this.server = new grpc.Server();
    this.server.addService(service, this.handlers());
    const port = process.env.GRPC_PORT || '50051';
    await new Promise<void>((resolveBind, rejectBind) => {
      this.server?.bindAsync(
        `0.0.0.0:${port}`,
        grpc.ServerCredentials.createInsecure(),
        (error) => {
          if (error) rejectBind(error);
          else resolveBind();
        },
      );
    });
    this.server.start();
    console.log(`Core API gRPC running on: 0.0.0.0:${port}`);
  }

  onModuleDestroy() {
    this.server?.tryShutdown(() => undefined);
  }

  private handlers(): grpc.UntypedServiceImplementation {
    return {
      LaunchSync: this.unary((claims, body) => {
        if (claims.scope !== 'admin' || claims.sub !== 'lti-bootstrap') {
          throw new Error('Invalid bootstrap claims');
        }
        return this.lti.syncLaunch(body);
      }),
      ListCourses: this.unary((claims) => this.courses.listCourses(claims)),
      GetCourse: this.unary((claims, body) => this.courses.getCourse(claims, body.courseId)),
      ListChapters: this.unary((claims, body) => this.courses.getChapters(claims, body.courseId)),
      ListLearningOutcomes: this.unary((claims, body) =>
        this.courses.getLearningOutcomes(claims, body.courseId),
      ),
      SyncCurriculumFromCanvas: this.unary((claims, body) =>
        this.curriculumImports.syncFromCanvas(claims, body.courseId),
      ),
      ListCurriculumImports: this.unary((claims, body) =>
        this.curriculumImports.listImports(claims, body.courseId, body.limit),
      ),
      ApplyCurriculumImport: this.unary((claims, body) =>
        this.curriculumImports.applyImport(claims, body.importId),
      ),
      CreateUploadSession: this.unary((claims, body) =>
        this.documents.createUploadSession(claims, body),
      ),
      ConfirmUpload: this.unary((claims, body) =>
        this.documents.confirmUpload(claims, body.documentId),
      ),
      ListDocuments: this.unary((claims, body) =>
        this.documents.listDocuments(claims, body.courseId, body.limit, body.offset),
      ),
      GetDocument: this.unary((claims, body) =>
        this.documents.getDocument(claims, body.documentId),
      ),
      GetDocumentChunks: this.unary((claims, body) =>
        this.documents.getDocumentChunks(claims, body.documentId, body.page),
      ),
      GetDocumentFileUrl: this.unary((claims, body) =>
        this.documents.getDocumentFileUrl(claims, body.documentId),
      ),
      DeleteDocument: this.unary((claims, body) =>
        this.documents.deleteDocument(claims, body.documentId),
      ),
      SyncDocumentsFromCanvas: this.unary((claims, body) =>
        this.canvasDocuments.syncFromCanvas(claims, body.courseId),
      ),
      UpdateDocumentPlacement: this.unary((claims, body) =>
        this.canvasDocuments.updatePlacement(claims, body.documentId, {
          role: body.role,
          chapterCode: body.chapterCode,
        }),
      ),
      ListLessons: this.unary((claims, body) =>
        this.lessons.list(claims, body.courseId, body.status),
      ),
      GetLesson: this.unary((claims, body) => this.lessons.get(claims, body.lessonId)),
      GetLessonCards: this.unary((claims, body) =>
        this.lessons.cards(claims, body.lessonId, body.status),
      ),
      GetLessonQuiz: this.unary((claims, body) =>
        this.lessons.quiz(claims, body.lessonId, body.status),
      ),
      PublishLesson: this.unary((claims, body) =>
        this.lessons.publish(claims, body.lessonId),
      ),
      ListReviewDrafts: this.unary((claims, body) =>
        this.review.listDrafts(claims, body.courseId, body.kind),
      ),
      ApproveCard: this.unary((claims, body) => this.review.approveCard(claims, body.cardId)),
      RejectCard: this.unary((claims, body) =>
        this.review.rejectCard(claims, body.cardId, body.reason),
      ),
      UpdateCard: this.unary((claims, body) =>
        this.review.updateCard(claims, body.cardId, body.content),
      ),
      ApproveQuizItem: this.unary((claims, body) =>
        this.review.approveQuizItem(claims, body.quizId),
      ),
      RejectQuizItem: this.unary((claims, body) =>
        this.review.rejectQuizItem(claims, body.quizId, body.reason),
      ),
      UpdateQuizItem: this.unary((claims, body) =>
        this.review.updateQuizItem(claims, body.quizId, body.data),
      ),
      SubmitQuiz: this.unary((claims, body) => this.quiz.submit(claims, body)),
      GetCanvasQuizContext: this.unary((claims, body) => this.quizSets.context(claims, body)),
      CreateQuizSet: this.unary((claims, body) => this.quizSets.create(claims, body)),
      GetQuizSet: this.unary((claims, body) => this.quizSets.get(claims, body.quizSetId)),
      GetQuizBuilderContext: this.unary((claims, body) => this.quizSets.builderContext(claims, body)),
      StartQuizSet: this.unary((claims, body) => this.quizSets.start(claims, body)),
      SubmitQuizSet: this.unary((claims, body) => this.quizSets.submit(claims, body)),
      GetQuizSetResults: this.unary((claims, body) => this.quizSets.results(claims, body)),
      ListQuizAttempts: this.unary((claims, body) =>
        this.quiz.attempts(claims, body.lessonId),
      ),
      CreateContentGenerationRequest: this.unary((claims, body) =>
        this.contentGeneration.createRequest(claims, body),
      ),
      ListContentGenerationRequests: this.unary((claims, body) =>
        this.contentGeneration.listRequests(
          claims,
          body.courseId,
          body.limit,
          body.type,
        ),
      ),
    };
  }

  private unary<TBody = any>(
    handler: (claims: BffClaims, body: TBody) => Promise<unknown> | unknown,
  ) {
    return async (
      call: UnaryCall<JsonRequest | EmptyRequest>,
      callback: UnaryCallback,
    ) => {
      try {
        const claims = await this.claimsFromMetadata(call.metadata);
        const body = this.parseBody<TBody>(call.request as JsonRequest);
        const result = await handler(claims, body);
        callback(null, { json: JSON.stringify(result ?? null) });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        callback({
          code: error instanceof HttpException
            ? ({ 400: grpc.status.INVALID_ARGUMENT, 401: grpc.status.UNAUTHENTICATED, 403: grpc.status.PERMISSION_DENIED, 404: grpc.status.NOT_FOUND, 409: grpc.status.ALREADY_EXISTS }[error.getStatus()] ?? grpc.status.INTERNAL)
            : grpc.status.INTERNAL,
          message,
        } as grpc.ServiceError);
      }
    };
  }

  private parseBody<TBody>(request: JsonRequest): TBody {
    if (!request?.json) {
      return {} as TBody;
    }
    return JSON.parse(request.json) as TBody;
  }

  private async claimsFromMetadata(metadata: grpc.Metadata) {
    const raw = metadata.get('authorization')[0];
    const header = typeof raw === 'string' ? raw : raw?.toString();
    if (!header?.startsWith('Bearer ')) {
      throw new Error('Missing Authorization metadata');
    }
    return this.jwt.verify(header.slice('Bearer '.length));
  }
}
