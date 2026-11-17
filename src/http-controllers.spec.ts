import { UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { BffClaims } from './auth/bff-claims';
import { BffJwtGuard } from './auth/bff-jwt.guard';
import { BffJwtService } from './auth/bff-jwt.service';
import { ChatController } from './modules/chat/chat.controller';
import { ChatService } from './modules/chat/chat.service';
import { ContentGenerationController } from './modules/content-generation/content-generation.controller';
import { ContentGenerationService } from './modules/content-generation/content-generation.service';
import { CourseController } from './modules/course/course.controller';
import { CourseService } from './modules/course/course.service';
import { CurriculumImportController } from './modules/curriculum/curriculum-import.controller';
import { CurriculumImportService } from './modules/curriculum/curriculum-import.service';
import { CanvasDocumentSyncService } from './modules/canvas-sync/canvas-document-sync.service';
import { CanvasSyncController } from './modules/canvas-sync/canvas-sync.controller';
import { CanvasSyncStatusService } from './modules/canvas-sync/canvas-sync-status.service';
import { DocumentController } from './modules/document/document.controller';
import { DocumentService } from './modules/document/document.service';
import { EssayProcessorController } from './modules/essay-processor/essay-processor.controller';
import { EssayProcessorService } from './modules/essay-processor/essay-processor.service';
import { LearnerModelService } from './modules/learning-agent/learner-model.service';
import { LearningAgentController } from './modules/learning-agent/learning-agent.controller';
import { LessonController } from './modules/lesson/lesson.controller';
import { LessonService } from './modules/lesson/lesson.service';
import { LtiController } from './modules/lti/lti.controller';
import { LtiService } from './modules/lti/lti.service';
import { MicroContentAttemptService } from './modules/micro-content/services/micro-content-attempt.service';
import { MicroContentController } from './modules/micro-content/micro-content.controller';
import { MicroContentService } from './modules/micro-content/services/micro-content.service';
import { MicroContentVideoService } from './modules/micro-content/services/micro-content-video.service';
import { ModelSettingsController } from './modules/model-settings/model-settings.controller';
import { ModelSettingsService } from './modules/model-settings/model-settings.service';
import { EssayGradingService } from './modules/quiz/services/essay-grading.service';
import { QuizController } from './modules/quiz/controllers/quiz.controller';
import { QuizSetController } from './modules/quiz/controllers/quiz-set.controller';
import { QuizSetService } from './modules/quiz/services/quiz-set.service';
import { QuizService } from './modules/quiz/services/quiz.service';
import { ReviewController } from './modules/review/review.controller';
import { ReviewService } from './modules/review/review.service';
import { VideoAssetController } from './modules/video-asset/video-asset.controller';
import { VideoAssetService } from './modules/video-asset/video-asset.service';

function makeClaims(overrides: Partial<BffClaims> = {}): BffClaims {
  return {
    sub: 'user-1',
    courseId: 'course-1',
    roles: ['instructor'],
    scope: 'course',
    jti: 'jti-1',
    iat: 1_700_000_000,
    exp: 1_800_000_000,
    ...overrides,
  };
}

function makeMockService<T extends string>(methods: T[]) {
  const rec = {} as Record<T, jest.Mock>;
  for (const method of methods) {
    rec[method] = jest.fn(async (...args: unknown[]) => ({ method, args }));
  }
  return rec;
}

describe('HTTP Controllers + ValidationPipe + BffJwtGuard', () => {
  let app: NestFastifyApplication;

  const claims = makeClaims();
  const mockJwtService = {
    verify: jest.fn(async (token: string) => {
      if (token === 'valid-token') return claims;
      if (token === 'system-token') {
        return makeClaims({ sub: 'lti-bootstrap', roles: ['system'], scope: 'admin' });
      }
      throw new UnauthorizedException('Invalid token');
    }),
  };

  const ltiService = makeMockService(['syncLaunch']);
  const courseService = makeMockService([
    'listCourses',
    'getCourse',
    'getChapters',
    'getLearningOutcomes',
  ]);
  const curriculumImports = makeMockService(['syncFromCanvas', 'listImports', 'applyImport']);
  const documentService = makeMockService([
    'listDocuments',
    'createUploadSession',
    'getDocument',
    'getDocumentChunks',
    'getDocumentFileUrl',
    'confirmUpload',
    'deleteDocument',
  ]);
  const canvasDocuments = makeMockService(['syncFromCanvas', 'updatePlacement']);
  const canvasSyncStatus = makeMockService(['status']);
  const lessonService = makeMockService(['list', 'get', 'cards', 'quiz', 'publish']);
  const reviewService = makeMockService([
    'listDrafts',
    'approveCard',
    'rejectCard',
    'updateCard',
    'approveQuizItem',
    'approveQuizItems',
    'rejectQuizItem',
    'updateQuizItem',
  ]);
  const contentGenService = makeMockService(['listRequests', 'createRequest']);
  const quizService = makeMockService(['submit', 'attempts']);
  const essayGrading = makeMockService(['list', 'grade', 'retry']);
  const quizSets = makeMockService([
    'context',
    'builderContext',
    'create',
    'get',
    'start',
    'submit',
    'results',
    'submissionDetail',
  ]);
  const learnerModel = makeMockService(['summary', 'courseMastery']);
  const modelSettings = makeMockService(['list', 'set']);
  const chat = makeMockService([
    'getSettings',
    'setMode',
    'recordRun',
    'rateRun',
    'stats',
    'catalog',
    'listConversations',
    'getConversation',
    'deleteConversation',
  ]);
  const essayProcessors = makeMockService([
    'receiveNotices',
    'getReport',
    'createProcessor',
    'updateProcessor',
    'getProcessor',
  ]);
  const microContent = makeMockService([
    'list',
    'requestOutline',
    'create',
    'get',
    'update',
    'delete',
    'publish',
    'saveQuestions',
    'requestScript',
    'saveScript',
    'requestRender',
    'requestQuiz',
  ]);
  const microContentVideo = makeMockService([
    'createUpload',
    'confirmUpload',
    'getVideoUrl',
    'getSubtitlesUrl',
  ]);
  const microContentAttempt = makeMockService(['getResult', 'reportProgress', 'submit', 'listAttempts']);
  const videoAsset = makeMockService([
    'listAssets',
    'checkHash',
    'createUpload',
    'attachToMicroContent',
    'getAsset',
    'confirmUpload',
    'getStreamUrl',
    'updateAsset',
    'deleteAsset',
    'forkAsset',
  ]);

  const authHeader = { authorization: 'Bearer valid-token' };

  async function injectJson(opts: {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    payload?: unknown;
    headers?: Record<string, string>;
  }) {
    const res = await app.inject({
      method: opts.method,
      url: opts.url,
      headers: opts.headers ?? authHeader,
      payload: opts.payload as Record<string, unknown> | undefined,
    });
    return {
      statusCode: res.statusCode,
      body: res.body ? JSON.parse(res.body) : null,
    };
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        LtiController,
        CourseController,
        CurriculumImportController,
        DocumentController,
        CanvasSyncController,
        LessonController,
        ReviewController,
        ContentGenerationController,
        QuizController,
        QuizSetController,
        LearningAgentController,
        ModelSettingsController,
        ChatController,
        EssayProcessorController,
        MicroContentController,
        VideoAssetController,
      ],
      providers: [
        BffJwtGuard,
        { provide: BffJwtService, useValue: mockJwtService },
        { provide: LtiService, useValue: ltiService },
        { provide: CourseService, useValue: courseService },
        { provide: CurriculumImportService, useValue: curriculumImports },
        { provide: DocumentService, useValue: documentService },
        { provide: CanvasDocumentSyncService, useValue: canvasDocuments },
        { provide: CanvasSyncStatusService, useValue: canvasSyncStatus },
        { provide: LessonService, useValue: lessonService },
        { provide: ReviewService, useValue: reviewService },
        { provide: ContentGenerationService, useValue: contentGenService },
        { provide: QuizService, useValue: quizService },
        { provide: EssayGradingService, useValue: essayGrading },
        { provide: QuizSetService, useValue: quizSets },
        { provide: LearnerModelService, useValue: learnerModel },
        { provide: ModelSettingsService, useValue: modelSettings },
        { provide: ChatService, useValue: chat },
        { provide: EssayProcessorService, useValue: essayProcessors },
        { provide: MicroContentService, useValue: microContent },
        { provide: MicroContentVideoService, useValue: microContentVideo },
        { provide: MicroContentAttemptService, useValue: microContentAttempt },
        { provide: VideoAssetService, useValue: videoAsset },
      ],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({ bodyLimit: 10 * 1024 * 1024 }),
    );
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects missing or invalid BFF JWT with 401 and forwards claims on valid token', async () => {
    const noAuth = await injectJson({ method: 'GET', url: '/api/courses', headers: {} });
    expect(noAuth.statusCode).toBe(401);

    const badAuth = await injectJson({
      method: 'GET',
      url: '/api/courses',
      headers: { authorization: 'Bearer wrong' },
    });
    expect(badAuth.statusCode).toBe(401);

    const ok = await injectJson({ method: 'GET', url: '/api/courses' });
    expect(ok.statusCode).toBe(200);
    expect(courseService.listCourses).toHaveBeenCalledWith(claims);
  });

  it('validates LtiController launch-sync payload with targetId: null and strips extra email', async () => {
    const ok = await injectJson({
      method: 'POST',
      url: '/api/lti/launch-sync',
      headers: { authorization: 'Bearer system-token' },
      payload: {
        lmsType: 'canvas',
        lmsSub: 'canvas-sub-1',
        email: 'gv@uni.edu',
        displayName: 'GV A',
        role: 'instructor',
        courseRole: 'instructor',
        lmsContextId: 'ctx-1',
        contextTitle: 'KTPM',
        resourceLinkId: 'rl-1',
        targetKind: undefined,
        targetId: null,
        customClaims: { course_id: '42' },
        nrps: {
          contextMembershipsUrl: 'https://canvas.test/nrps',
          serviceVersions: ['2.0'],
        },
      },
    });
    expect(ok.statusCode).toBe(201);
    const passedDto = ltiService.syncLaunch.mock.calls[0][0] as Record<string, unknown>;
    expect(passedDto.lmsSub).toBe('canvas-sub-1');
    expect(passedDto.targetId).toBeNull();
    expect(passedDto.email).toBeUndefined();

    const invalid = await injectJson({
      method: 'POST',
      url: '/api/lti/launch-sync',
      payload: { lmsType: 'canvas' },
    });
    expect(invalid.statusCode).toBe(400);
  });

  it('resolves static routes before :id routes across documents, essay-processors, micro-content, quiz-sets, review, video-assets, chat', async () => {
    await injectJson({
      method: 'GET',
      url: '/api/documents/canvas-sync-status?courseId=c1',
    });
    expect(canvasSyncStatus.status).toHaveBeenCalledWith(claims, 'c1');
    expect(documentService.getDocument).not.toHaveBeenCalled();

    await injectJson({
      method: 'GET',
      url: '/api/essay-processors/report?submissionId=s1&userSub=u1',
    });
    expect(essayProcessors.getReport).toHaveBeenCalledWith(claims, {
      submissionId: 's1',
      userSub: 'u1',
    });
    expect(essayProcessors.getProcessor).not.toHaveBeenCalled();

    await injectJson({
      method: 'POST',
      url: '/api/essay-processors/notices',
      payload: { notices: [{ notice_id: 'n1' }] },
    });
    expect(essayProcessors.receiveNotices).toHaveBeenCalledWith(claims, {
      notices: [{ notice_id: 'n1' }],
    });

    await injectJson({
      method: 'POST',
      url: '/api/micro-content/outline',
      payload: { courseId: 'c1', documentId: 'doc-1' },
    });
    expect(microContent.requestOutline).toHaveBeenCalledWith(claims, {
      courseId: 'c1',
      documentId: 'doc-1',
    });

    await injectJson({ method: 'GET', url: '/api/micro-content/attempts/att-1/result' });
    expect(microContentAttempt.getResult).toHaveBeenCalledWith(claims, { attemptId: 'att-1' });
    expect(microContent.get).not.toHaveBeenCalled();

    await injectJson({
      method: 'GET',
      url: '/api/quiz-sets/canvas-context?courseId=c1&moduleId=m1&chapterId=ch1',
    });
    expect(quizSets.context).toHaveBeenCalledWith(claims, {
      courseId: 'c1',
      moduleId: 'm1',
      chapterId: 'ch1',
    });
    expect(quizSets.get).not.toHaveBeenCalled();

    await injectJson({
      method: 'POST',
      url: '/api/quiz-sets/builder-context',
      payload: { courseId: 'c1', loIds: ['lo-1'] },
    });
    expect(quizSets.builderContext).toHaveBeenCalledWith(claims, {
      courseId: 'c1',
      loIds: ['lo-1'],
    });

    await injectJson({
      method: 'POST',
      url: '/api/review/quiz-items/approve-batch',
      payload: { quizIds: ['q1', 'q2'] },
    });
    expect(reviewService.approveQuizItems).toHaveBeenCalledWith(claims, ['q1', 'q2']);

    await injectJson({
      method: 'POST',
      url: '/api/video-assets/check-hash',
      payload: { fileHash: 'sha256-abc' },
    });
    expect(videoAsset.checkHash).toHaveBeenCalledWith(claims, { fileHash: 'sha256-abc' });

    await injectJson({
      method: 'GET',
      url: '/api/chat/conversations/detail?courseId=c1&conversationId=conv-1',
    });
    expect(chat.getConversation).toHaveBeenCalledWith(claims, {
      courseId: 'c1',
      conversationId: 'conv-1',
    });
  });

  it('validates integer query params and preserves @Allow JSON fields while stripping unknown properties', async () => {
    const docList = await injectJson({
      method: 'GET',
      url: '/api/documents?courseId=c1&limit=10&offset=5',
    });
    expect(docList.statusCode).toBe(200);
    expect(documentService.listDocuments).toHaveBeenCalledWith(claims, 'c1', 10, 5);

    const badDocLimit = await injectJson({
      method: 'GET',
      url: '/api/documents?courseId=c1&limit=abc',
    });
    expect(badDocLimit.statusCode).toBe(400);

    const badImportLimit = await injectJson({
      method: 'GET',
      url: '/api/curriculum/imports?courseId=c1&limit=1.5',
    });
    expect(badImportLimit.statusCode).toBe(400);

    const badVideoOffset = await injectJson({
      method: 'GET',
      url: '/api/video-assets?offset=xyz',
    });
    expect(badVideoOffset.statusCode).toBe(400);

    const cgRes = await injectJson({
      method: 'POST',
      url: '/api/content-generations',
      payload: {
        courseId: 'c1',
        type: 'quiz',
        scope: { target_kind: 'lo', count: 3 },
        scopes: [{ target_kind: 'lo', count: 2 }],
      },
    });
    expect(cgRes.statusCode).toBe(201);
    expect(contentGenService.createRequest).toHaveBeenCalledWith(claims, {
      courseId: 'c1',
      type: 'quiz',
      scope: { target_kind: 'lo', count: 3 },
      scopes: [{ target_kind: 'lo', count: 2 }],
    });

    const editQuiz = await injectJson({
      method: 'PATCH',
      url: '/api/review/quiz-items/q-1',
      payload: {
        type: 'MCQ_SINGLE',
        question: 'Updated question?',
        options: ['A', 'B'],
        correct_answer: 1,
        explanation: 'Detailed explanation',
      },
    });
    expect(editQuiz.statusCode).toBe(200);
    expect(reviewService.updateQuizItem).toHaveBeenCalledWith(claims, 'q-1', {
      question: 'Updated question?',
      options: ['A', 'B'],
      correct_answer: 1,
      explanation: 'Detailed explanation',
    });

    const editCard = await injectJson({
      method: 'PATCH',
      url: '/api/review/cards/card-1',
      payload: { content: { front: 'F', back: { text: 'B' } } },
    });
    expect(editCard.statusCode).toBe(200);
    expect(reviewService.updateCard).toHaveBeenCalledWith(claims, 'card-1', {
      front: 'F',
      back: { text: 'B' },
    });

    const setBindingNull = await injectJson({
      method: 'PUT',
      url: '/api/model-bindings',
      payload: { task: 'tutor', profile: null },
    });
    expect(setBindingNull.statusCode).toBe(200);
    expect(modelSettings.set).toHaveBeenCalledWith(claims, {
      task: 'tutor',
      profile: null,
    });
  });

  it('dispatches all newly exposed curriculum, learning-agent, chat, essay, quiz, micro-content and video-asset HTTP endpoints', async () => {
    await injectJson({ method: 'POST', url: '/api/curriculum/sync-canvas', payload: { courseId: 'c1' } });
    expect(curriculumImports.syncFromCanvas).toHaveBeenCalledWith(claims, 'c1');

    await injectJson({ method: 'GET', url: '/api/curriculum/imports?courseId=c1&limit=5' });
    expect(curriculumImports.listImports).toHaveBeenCalledWith(claims, 'c1', 5);

    await injectJson({ method: 'POST', url: '/api/curriculum/imports/imp-1/apply' });
    expect(curriculumImports.applyImport).toHaveBeenCalledWith(claims, 'imp-1');

    await injectJson({ method: 'GET', url: '/api/learning-agent/summary?courseId=c1&userId=u2' });
    expect(learnerModel.summary).toHaveBeenCalledWith(claims, { courseId: 'c1', userId: 'u2' });

    await injectJson({ method: 'GET', url: '/api/learning-agent/course-mastery?courseId=c1' });
    expect(learnerModel.courseMastery).toHaveBeenCalledWith(claims, { courseId: 'c1' });

    await injectJson({ method: 'GET', url: '/api/model-bindings' });
    expect(modelSettings.list).toHaveBeenCalledWith(claims);

    await injectJson({ method: 'PUT', url: '/api/chat/mode', payload: { mode: 'tools' } });
    expect(chat.setMode).toHaveBeenCalledWith(claims, { mode: 'tools' });

    await injectJson({
      method: 'POST',
      url: '/api/chat/runs',
      payload: {
        courseId: 'c1',
        mode: 'graph',
        question: 'What is BKT?',
        citations: [{ chunkId: 'ck1' }],
        toolCalls: [{ name: 'search_course_chunks' }],
      },
    });
    expect(chat.recordRun).toHaveBeenCalled();

    await injectJson({ method: 'POST', url: '/api/chat/runs/run-1/rate', payload: { rating: 1 } });
    expect(chat.rateRun).toHaveBeenCalledWith(claims, { runId: 'run-1', rating: 1 });

    await injectJson({ method: 'DELETE', url: '/api/chat/conversations/conv-1?courseId=c1' });
    expect(chat.deleteConversation).toHaveBeenCalledWith(claims, {
      courseId: 'c1',
      conversationId: 'conv-1',
    });

    await injectJson({
      method: 'POST',
      url: '/api/essay-processors',
      payload: {
        courseId: 'c1',
        pnsUrl: 'https://canvas/pns',
        handlerUrl: 'https://web/handler',
        title: 'Essay 1',
        rubric: [{ criterion: 'Clarity', points: 10 }],
        visibleToOwner: true,
      },
    });
    expect(essayProcessors.createProcessor).toHaveBeenCalled();

    await injectJson({
      method: 'PATCH',
      url: '/api/essay-processors/proc-1',
      payload: { title: 'Essay Updated', rubric: [{ criterion: 'Depth', points: 10 }] },
    });
    expect(essayProcessors.updateProcessor).toHaveBeenCalledWith(
      claims,
      expect.objectContaining({ processorId: 'proc-1', title: 'Essay Updated' }),
    );

    await injectJson({ method: 'GET', url: '/api/quiz/essays/review?courseId=c1' });
    expect(essayGrading.list).toHaveBeenCalledWith(claims, { courseId: 'c1' });

    await injectJson({
      method: 'POST',
      url: '/api/quiz/essays/att-1/grade',
      payload: { score: '8.5', feedback: 'Solid' },
    });
    expect(essayGrading.grade).toHaveBeenCalledWith(claims, {
      attemptId: 'att-1',
      score: '8.5',
      feedback: 'Solid',
    });

    await injectJson({ method: 'POST', url: '/api/quiz/essays/att-1/retry' });
    expect(essayGrading.retry).toHaveBeenCalledWith(claims, { attemptId: 'att-1' });

    await injectJson({
      method: 'POST',
      url: '/api/quiz-sets/qs-1/submit',
      payload: {
        resourceLinkId: 'rl-1',
        answers: [{ quizId: 'q1', chosenAnswer: 0 }],
        sessionId: 'sess-1',
      },
    });
    expect(quizSets.submit).toHaveBeenCalledWith(claims, {
      quizSetId: 'qs-1',
      resourceLinkId: 'rl-1',
      answers: [{ quizId: 'q1', chosenAnswer: 0 }],
      sessionId: 'sess-1',
    });

    await injectJson({ method: 'GET', url: '/api/micro-content?courseId=c1' });
    expect(microContent.list).toHaveBeenCalledWith(claims, 'c1');

    await injectJson({ method: 'POST', url: '/api/micro-content/mc-1/render', payload: {} });
    expect(microContent.requestRender).toHaveBeenCalledWith(claims, {
      microContentId: 'mc-1',
      allowFlagged: undefined,
    });

    await injectJson({
      method: 'POST',
      url: '/api/micro-content/mc-1/render',
      payload: { allowFlagged: true },
    });
    expect(microContent.requestRender).toHaveBeenLastCalledWith(claims, {
      microContentId: 'mc-1',
      allowFlagged: true,
    });

    await injectJson({ method: 'POST', url: '/api/micro-content/mc-1/upload/confirm' });
    expect(microContentVideo.confirmUpload).toHaveBeenCalledWith(claims, { microContentId: 'mc-1' });

    await injectJson({ method: 'GET', url: '/api/micro-content/mc-1/subtitles' });
    expect(microContentVideo.getSubtitlesUrl).toHaveBeenCalledWith(claims, { microContentId: 'mc-1' });

    await injectJson({
      method: 'POST',
      url: '/api/micro-content/mc-1/progress',
      payload: { positionMs: 12000, playedMs: 10000 },
    });
    expect(microContentAttempt.reportProgress).toHaveBeenCalledWith(claims, {
      microContentId: 'mc-1',
      positionMs: 12000,
      playedMs: 10000,
    });

    await injectJson({
      method: 'POST',
      url: '/api/video-assets/va-1/confirm-upload',
      payload: { sizeBytes: 1024, durationMs: 5000, objectKey: 'ignored-by-whitelist' },
    });
    expect(videoAsset.confirmUpload).toHaveBeenCalledWith(claims, {
      assetId: 'va-1',
      sizeBytes: 1024,
      durationMs: 5000,
    });

    await injectJson({
      method: 'POST',
      url: '/api/video-assets/va-1/stream-url',
    });
    const streamRes = await injectJson({
      method: 'GET',
      url: '/api/video-assets/va-1/stream-url?microContentId=mc-1',
    });
    expect(streamRes.statusCode).toBe(200);
    expect(videoAsset.getStreamUrl).toHaveBeenCalledWith(claims, {
      assetId: 'va-1',
      microContentId: 'mc-1',
    });

    await injectJson({
      method: 'POST',
      url: '/api/video-assets/attach',
      payload: { microContentId: 'mc-1', assetId: null },
    });
    expect(videoAsset.attachToMicroContent).toHaveBeenCalledWith(claims, {
      microContentId: 'mc-1',
      assetId: null,
    });

    await injectJson({ method: 'POST', url: '/api/video-assets/va-1/fork', payload: { targetCourseId: 'c2' } });
    expect(videoAsset.forkAsset).toHaveBeenCalledWith(claims, {
      assetId: 'va-1',
      targetCourseId: 'c2',
    });
  });
});
