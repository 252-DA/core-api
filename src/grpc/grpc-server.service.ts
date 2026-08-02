import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
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
import { ContentGenerationService } from '../content-generation/content-generation.service';
import {
  type CoreRpcMethod,
  type CoreRpcRequest,
  type CoreRpcResponse,
  type JsonRequestEnvelope,
  type JsonResponseEnvelope,
  parseCoreRpcRequest,
} from './core-api-rpc.contract';

type UnaryCall = grpc.ServerUnaryCall<
  JsonRequestEnvelope,
  JsonResponseEnvelope
>;
type UnaryCallback = grpc.sendUnaryData<JsonResponseEnvelope>;
type CoreRpcHandler<TMethod extends CoreRpcMethod> = (
  claims: BffClaims,
  body: CoreRpcRequest<TMethod>,
) => Promise<CoreRpcResponse<TMethod>> | CoreRpcResponse<TMethod>;
type UnaryImplementation = (
  call: UnaryCall,
  callback: UnaryCallback,
) => Promise<void>;
type CoreRpcHandlerMap = {
  [TMethod in CoreRpcMethod]: UnaryImplementation;
};

interface LoadedCorePackage {
  ai_lms?: {
    v1?: {
      CoreApiService?: grpc.ServiceClientConstructor;
    };
  };
}

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
    private readonly contentGeneration: ContentGenerationService,
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
    const loaded = grpc.loadPackageDefinition(
      packageDefinition,
    ) as unknown as LoadedCorePackage;
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
    const handlers = {
      LaunchSync: this.unary('LaunchSync', (claims, body) => {
        if (claims.scope !== 'admin' || claims.sub !== 'lti-bootstrap') {
          throw new Error('Invalid bootstrap claims');
        }
        return this.lti.syncLaunch(body);
      }),
      ListCourses: this.unary('ListCourses', (claims) =>
        this.courses.listCourses(claims),
      ),
      GetCourse: this.unary('GetCourse', (claims, body) =>
        this.courses.getCourse(claims, body.courseId),
      ),
      ListChapters: this.unary('ListChapters', (claims, body) =>
        this.courses.getChapters(claims, body.courseId),
      ),
      ListLearningOutcomes: this.unary('ListLearningOutcomes', (claims, body) =>
        this.courses.getLearningOutcomes(claims, body.courseId),
      ),
      CreateUploadSession: this.unary('CreateUploadSession', (claims, body) =>
        this.documents.createUploadSession(claims, body),
      ),
      ConfirmUpload: this.unary('ConfirmUpload', (claims, body) =>
        this.documents.confirmUpload(claims, body.documentId),
      ),
      ListDocuments: this.unary('ListDocuments', (claims, body) =>
        this.documents.listDocuments(
          claims,
          body.courseId,
          body.limit,
          body.offset,
        ),
      ),
      DeleteDocument: this.unary('DeleteDocument', (claims, body) =>
        this.documents.deleteDocument(claims, body.documentId),
      ),
      ListLessons: this.unary('ListLessons', (claims, body) =>
        this.lessons.list(claims, body.courseId, body.status),
      ),
      GetLesson: this.unary('GetLesson', (claims, body) =>
        this.lessons.get(claims, body.lessonId),
      ),
      GetLessonCards: this.unary('GetLessonCards', (claims, body) =>
        this.lessons.cards(claims, body.lessonId, body.status),
      ),
      GetLessonQuiz: this.unary('GetLessonQuiz', (claims, body) =>
        this.lessons.quiz(claims, body.lessonId, body.status),
      ),
      PublishLesson: this.unary('PublishLesson', (claims, body) =>
        this.lessons.publish(claims, body.lessonId),
      ),
      ListReviewDrafts: this.unary('ListReviewDrafts', (claims, body) =>
        this.review.listDrafts(claims, body.courseId, body.kind),
      ),
      ApproveCard: this.unary('ApproveCard', (claims, body) =>
        this.review.approveCard(claims, body.cardId),
      ),
      RejectCard: this.unary('RejectCard', (claims, body) =>
        this.review.rejectCard(claims, body.cardId, body.reason),
      ),
      UpdateCard: this.unary('UpdateCard', (claims, body) =>
        this.review.updateCard(claims, body.cardId, body.content),
      ),
      ApproveQuizItem: this.unary('ApproveQuizItem', (claims, body) =>
        this.review.approveQuizItem(claims, body.quizId),
      ),
      RejectQuizItem: this.unary('RejectQuizItem', (claims, body) =>
        this.review.rejectQuizItem(claims, body.quizId, body.reason),
      ),
      UpdateQuizItem: this.unary('UpdateQuizItem', (claims, body) =>
        this.review.updateQuizItem(claims, body.quizId, body.data),
      ),
      SubmitQuiz: this.unary('SubmitQuiz', (claims, body) =>
        this.quiz.submit(claims, body),
      ),
      ListQuizAttempts: this.unary('ListQuizAttempts', (claims, body) =>
        this.quiz.attempts(claims, body.lessonId),
      ),
      CreateContentGenerationRequest: this.unary(
        'CreateContentGenerationRequest',
        (claims, body) => this.contentGeneration.createRequest(claims, body),
      ),
    } satisfies CoreRpcHandlerMap;

    return handlers;
  }

  private unary<TMethod extends CoreRpcMethod>(
    method: TMethod,
    handler: CoreRpcHandler<TMethod>,
  ) {
    return async (call: UnaryCall, callback: UnaryCallback) => {
      try {
        const claims = await this.claimsFromMetadata(call.metadata);
        const body = parseCoreRpcRequest(method, call.request?.json);
        const result = await handler(claims, body);
        callback(null, { json: JSON.stringify(result ?? null) });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        callback({
          code: grpc.status.INTERNAL,
          message,
        });
      }
    };
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
