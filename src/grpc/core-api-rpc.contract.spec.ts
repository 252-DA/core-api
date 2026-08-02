import { parseCoreRpcRequest } from './core-api-rpc.contract';

describe('parseCoreRpcRequest', () => {
  it('accepts an empty ListCourses request', () => {
    expect(parseCoreRpcRequest('ListCourses', undefined)).toEqual({});
  });

  it('rejects invalid JSON', () => {
    expect(() => parseCoreRpcRequest('GetCourse', '{')).toThrow();
  });

  it('rejects a non-object JSON body', () => {
    expect(() => parseCoreRpcRequest('GetCourse', '[]')).toThrow(
      'gRPC JSON request body must be an object',
    );
  });

  it('rejects a missing required field', () => {
    expect(() => parseCoreRpcRequest('GetCourse', '{}')).toThrow(
      'GetCourse requires a non-empty courseId',
    );
  });

  it('validates SubmitQuiz answers', () => {
    expect(() =>
      parseCoreRpcRequest('SubmitQuiz', '{"lessonId":"lesson-1"}'),
    ).toThrow('SubmitQuiz requires an answers array');

    expect(() =>
      parseCoreRpcRequest(
        'SubmitQuiz',
        '{"lessonId":"lesson-1","answers":[{"quizId":"quiz-1"}]}',
      ),
    ).toThrow('SubmitQuiz.answers[0] requires chosenAnswer');

    expect(
      parseCoreRpcRequest(
        'SubmitQuiz',
        '{"lessonId":"lesson-1","answers":[{"quizId":"quiz-1","chosenAnswer":null}]}',
      ),
    ).toEqual({
      lessonId: 'lesson-1',
      answers: [{ quizId: 'quiz-1', chosenAnswer: null }],
    });
  });

  it('requires UpdateCard content while allowing JSON null', () => {
    expect(() =>
      parseCoreRpcRequest('UpdateCard', '{"cardId":"card-1"}'),
    ).toThrow('UpdateCard requires content');

    expect(
      parseCoreRpcRequest('UpdateCard', '{"cardId":"card-1","content":null}'),
    ).toEqual({ cardId: 'card-1', content: null });
  });

  it('validates content-generation type', () => {
    expect(() =>
      parseCoreRpcRequest(
        'CreateContentGenerationRequest',
        '{"courseId":"course-1","type":"video","scope":{}}',
      ),
    ).toThrow('CreateContentGenerationRequest.type must be one of: card, quiz');
  });

  it('validates LaunchSync enums', () => {
    expect(() =>
      parseCoreRpcRequest(
        'LaunchSync',
        JSON.stringify({
          lmsType: 'blackboard',
          lmsSub: 'user-1',
          role: 'learner',
          courseRole: 'learner',
          lmsContextId: 'course-1',
        }),
      ),
    ).toThrow('LaunchSync.lmsType must be one of: openedx, moodle, canvas');

    const required = {
      lmsType: 'moodle',
      lmsSub: 'user-1',
      role: 'learner',
      courseRole: 'learner',
      lmsContextId: 'course-1',
    };
    expect(() =>
      parseCoreRpcRequest(
        'LaunchSync',
        JSON.stringify({ ...required, targetKind: 'document' }),
      ),
    ).toThrow(
      'LaunchSync.targetKind must be one of: lesson, card, quiz_set, chat, video',
    );
    expect(() =>
      parseCoreRpcRequest(
        'LaunchSync',
        JSON.stringify({ ...required, customClaims: [] }),
      ),
    ).toThrow('LaunchSync.customClaims must be an object');
  });
});
