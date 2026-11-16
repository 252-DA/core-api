import {
  Injectable,
  Logger,
  Module,
  Scope,
  type DynamicModule,
  type Type,
} from '@nestjs/common';
import { MODULE_METADATA } from '@nestjs/common/constants';
import { DiscoveryModule } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import {
  WorkerResultHandlerRegistry,
  buildHandlerMap,
} from './worker-result-handler.registry';
import {
  WorkerResultHandler,
  workerResultHandlerMetadata,
} from './worker-result-handler';
import { WORKER_RESULT_KINDS } from './worker-results.constants';
import { AppModule } from '../app.module';

@Injectable()
@WorkerResultHandler('QUIZ_GRADING_RESULT')
class QuizHandler implements WorkerResultHandler {
  handle() {
    return Promise.resolve('quiz');
  }
}

@Injectable()
@WorkerResultHandler('ESSAY_GRADING_RESULT')
class EssayHandler implements WorkerResultHandler {
  handle() {
    return Promise.resolve('essay');
  }
}

@Injectable()
@WorkerResultHandler('QUIZ_GRADING_RESULT')
class SecondQuizHandler implements WorkerResultHandler {
  handle() {
    return Promise.resolve('second');
  }
}

@Injectable({ scope: Scope.REQUEST })
@WorkerResultHandler('CURRICULUM_IMPORT_RESULT')
class RequestScopedHandler implements WorkerResultHandler {
  handle() {
    return Promise.resolve('scoped');
  }
}

@Module({ providers: [QuizHandler] })
class QuizDomainModule {}

@Module({ providers: [EssayHandler] })
class EssayDomainModule {}

@Module({ providers: [SecondQuizHandler] })
class OtherDomainModule {}

@Module({ providers: [QuizHandler] })
class QuizAgainModule {}

@Module({ providers: [RequestScopedHandler] })
class ScopedDomainModule {}

async function compile(imports: Type[]) {
  const moduleRef = await Test.createTestingModule({
    imports: [DiscoveryModule, ...imports],
    providers: [WorkerResultHandlerRegistry],
  }).compile();
  return { moduleRef, registry: moduleRef.get(WorkerResultHandlerRegistry) };
}

describe('WorkerResultHandlerRegistry', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('finds handlers declared in different domain modules', async () => {
    const { moduleRef, registry } = await compile([
      QuizDomainModule,
      EssayDomainModule,
    ]);
    await moduleRef.init();

    expect(registry.get('QUIZ_GRADING_RESULT')).toBe(
      moduleRef.get(QuizHandler, { strict: false }),
    );
    await expect(
      registry.get('ESSAY_GRADING_RESULT')?.handle({} as never, {} as never),
    ).resolves.toBe('essay');
  });

  it('warns at startup about kinds without a handler and returns none for them', async () => {
    const { moduleRef, registry } = await compile([QuizDomainModule]);
    await moduleRef.init();

    expect(warn).toHaveBeenCalledTimes(1);
    const [[message]] = warn.mock.calls as [[string]];
    expect(message).toContain('DOCUMENT_PROCESSING_RESULT');
    expect(message).not.toContain('QUIZ_GRADING_RESULT');
    expect(registry.get('DOCUMENT_PROCESSING_RESULT')).toBeUndefined();
  });

  it('refuses to start when two handlers claim the same kind', async () => {
    const { moduleRef } = await compile([QuizDomainModule, OtherDomainModule]);

    await expect(moduleRef.init()).rejects.toThrow(
      'QUIZ_GRADING_RESULT has 2 handlers: QuizHandler, SecondQuizHandler',
    );
  });

  it('points at a handler class listed in two modules', async () => {
    const { moduleRef } = await compile([QuizDomainModule, QuizAgainModule]);

    await expect(moduleRef.init()).rejects.toThrow('more than one module');
  });

  it('refuses a request-scoped handler', async () => {
    const { moduleRef } = await compile([ScopedDomainModule]);

    await expect(moduleRef.init()).rejects.toThrow(
      'RequestScopedHandler: handler must be a singleton provider',
    );
  });

  it('can answer before its own onModuleInit, when BullMQ starts first', async () => {
    const { moduleRef, registry } = await compile([QuizDomainModule]);

    expect(registry.get('QUIZ_GRADING_RESULT')).toBe(
      moduleRef.get(QuizHandler, { strict: false }),
    );
    await moduleRef.init();
    expect(warn).toHaveBeenCalledTimes(1); // chỉ quét một lần
  });
});

describe('buildHandlerMap', () => {
  const found = (kind: unknown, instance: unknown = { handle: jest.fn() }) => ({
    kind,
    name: 'SomeHandler',
    instance,
    singleton: true,
  });

  it('rejects a kind outside the contract', () => {
    expect(() => buildHandlerMap([found('QUIZ_GRADED')])).toThrow(
      'unknown kind "QUIZ_GRADED"',
    );
  });

  it('rejects a provider without handle()', () => {
    expect(() => buildHandlerMap([found('QUIZ_GRADING_RESULT', {})])).toThrow(
      'missing handle() method',
    );
  });

  it('accepts onFinalFailure as an optional method only', () => {
    const hook = { handle: jest.fn(), onFinalFailure: jest.fn() };
    expect(
      buildHandlerMap([found('QUIZ_GRADING_RESULT', hook)]).get(
        'QUIZ_GRADING_RESULT',
      ),
    ).toBe(hook);
    expect(() =>
      buildHandlerMap([
        found('QUIZ_GRADING_RESULT', {
          handle: jest.fn(),
          onFinalFailure: 'not a function',
        }),
      ]),
    ).toThrow('onFinalFailure must be a method');
  });
});

/**
 * Đồ thị module thật của app: mỗi kind đúng một handler. Quét từ AppModule
 * nên handler đặt ở module domain nào cũng được, không cần sửa test này.
 */
describe('app wiring', () => {
  type ModuleRef = Type | DynamicModule | { forwardRef: () => Type };

  function collectProviders(root: ModuleRef): unknown[] {
    const seen = new Set<unknown>();
    const providers: unknown[] = [];
    const visit = (ref: ModuleRef | undefined) => {
      if (!ref) return;
      if ('forwardRef' in ref && typeof ref.forwardRef === 'function') {
        return visit(ref.forwardRef());
      }
      const dynamic = 'module' in ref ? ref : undefined;
      const type = (dynamic?.module ?? ref) as Type;
      if (seen.has(dynamic ?? type)) return;
      seen.add(dynamic ?? type);
      const meta = (key: string) =>
        (Reflect.getMetadata(key, type) as unknown[] | undefined) ?? [];
      providers.push(
        ...meta(MODULE_METADATA.PROVIDERS),
        ...(dynamic?.providers ?? []),
      );
      for (const child of [
        ...meta(MODULE_METADATA.IMPORTS),
        ...(dynamic?.imports ?? []),
      ]) {
        visit(child as ModuleRef);
      }
    };
    visit(root);
    return providers;
  }

  it('registers exactly one handler per kind', () => {
    const kinds = collectProviders(AppModule)
      .filter((p): p is Type => typeof p === 'function')
      .map(
        (cls) =>
          Reflect.getMetadata(workerResultHandlerMetadata.KEY, cls) as unknown,
      )
      .filter((kind) => kind !== undefined);

    expect([...(kinds as string[])].sort()).toEqual(
      [...WORKER_RESULT_KINDS].sort(),
    );
  });
});
