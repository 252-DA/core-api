import { CanvasApiClient, toInternalCanvasUrl } from './canvas-api.client';

describe('CanvasApiClient pagination', () => {
  const previousUrl = process.env.CANVAS_API_URL;
  const previousToken = process.env.CANVAS_API_TOKEN;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    process.env.CANVAS_API_URL = 'https://canvas.example';
    process.env.CANVAS_API_TOKEN = 'test-token';
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });
  afterEach(() => {
    fetchMock.mockRestore();
    if (previousUrl === undefined) delete process.env.CANVAS_API_URL;
    else process.env.CANVAS_API_URL = previousUrl;
    if (previousToken === undefined) delete process.env.CANVAS_API_TOKEN;
    else process.env.CANVAS_API_TOKEN = previousToken;
  });

  it('collects course files across Link pages without per-file requests', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify([{ id: 11, updated_at: '2026-09-27T00:00:00Z' }]),
          {
            headers: {
              Link: '<https://canvas.example/api/v1/courses/1/files?page=2>; rel="next"',
            },
          },
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify([{ id: 12 }])));
    const files = await new CanvasApiClient().listCourseFiles('context-1');
    expect(files.map((f) => f.id)).toEqual([11, 12]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://canvas.example/api/v1/courses/lti_context_id%3Acontext-1/files?per_page=100',
    );
  });

  it('rejects a truncated listing rather than returning a destructive partial snapshot', async () => {
    fetchMock.mockImplementation(
      async () =>
        new Response('[]', {
          headers: { Link: '<https://canvas.example/next>; rel="next"' },
        }),
    );
    await expect(
      new CanvasApiClient().listCourseFiles('context-1'),
    ).rejects.toThrow('vượt giới hạn 20 trang');
  });

  it('rejects the whole listing when a later page fails', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response('[{"id":11}]', {
          headers: { Link: '<https://canvas.example/next>; rel="next"' },
        }),
      )
      .mockResolvedValueOnce(new Response('unavailable', { status: 503 }));
    await expect(
      new CanvasApiClient().listCourseFiles('context-1'),
    ).rejects.toThrow('HTTP 503');
  });
});

describe('toInternalCanvasUrl', () => {
  const env = {
    CANVAS_API_URL: 'http://canvas.docker:3000',
    LTI_PLATFORM_URL: 'https://canvas.example.dev',
    CANVAS_PUBLIC_URL: 'https://canvas-public.example.dev',
  } as NodeJS.ProcessEnv;

  it('rewrites the origin of links under LTI_PLATFORM_URL or CANVAS_PUBLIC_URL, keeping path and query', () => {
    expect(
      toInternalCanvasUrl(
        'https://canvas.example.dev/api/v1/courses/1/files?page=2&per_page=100',
        env,
      ),
    ).toBe(
      'http://canvas.docker:3000/api/v1/courses/1/files?page=2&per_page=100',
    );
    expect(
      toInternalCanvasUrl(
        'https://canvas-public.example.dev/files/3/download?download_frd=1',
        env,
      ),
    ).toBe('http://canvas.docker:3000/files/3/download?download_frd=1');
  });

  it('matches the public host regardless of scheme, since Canvas redirects with http', () => {
    expect(
      toInternalCanvasUrl(
        'http://canvas.example.dev/files/3/download?sf_verifier=abc',
        env,
      ),
    ).toBe('http://canvas.docker:3000/files/3/download?sf_verifier=abc');
  });

  it('leaves internal links, foreign hosts and invalid URLs untouched', () => {
    for (const url of [
      'http://canvas.docker:3000/api/v1/users/self',
      'https://bucket.s3.example.com/file.pdf?X-Amz-Signature=1',
      'https://canvas.example.dev.evil.test/api/v1/users/self',
      'not a url',
    ]) {
      expect(toInternalCanvasUrl(url, env)).toBe(url);
    }
  });

  it('does nothing when CANVAS_API_URL is unset', () => {
    expect(
      toInternalCanvasUrl('https://canvas.example.dev/api/v1/users/self', {
        LTI_PLATFORM_URL: 'https://canvas.example.dev',
      } as NodeJS.ProcessEnv),
    ).toBe('https://canvas.example.dev/api/v1/users/self');
  });
});

describe('CanvasApiClient with an internal CANVAS_API_URL', () => {
  const saved = { ...process.env };
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    process.env.CANVAS_API_URL = 'http://canvas.docker:3000';
    process.env.LTI_PLATFORM_URL = 'https://canvas.example.dev';
    process.env.CANVAS_API_TOKEN = 'test-token';
    delete process.env.CANVAS_PUBLIC_URL;
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });
  afterEach(() => {
    fetchMock.mockRestore();
    process.env = { ...saved };
  });

  it('follows pagination links that still carry the public domain through the internal address', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response('[{"id":11}]', {
          headers: {
            Link: '<https://canvas.example.dev/api/v1/courses/1/files?page=2&per_page=100>; rel="next"',
          },
        }),
      )
      .mockResolvedValueOnce(new Response('[{"id":12}]'));
    const files = await new CanvasApiClient().listCourseFiles('context-1');
    expect(files.map((f) => f.id)).toEqual([11, 12]);
    expect(fetchMock.mock.calls[0][0]).toMatch(
      /^http:\/\/canvas\.docker:3000\/api\/v1\/courses\//,
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      'http://canvas.docker:3000/api/v1/courses/1/files?page=2&per_page=100',
    );
  });

  it('downloads from the URL Canvas gave without rewriting it, so the public file host can serve the bytes', async () => {
    fetchMock.mockResolvedValueOnce(new Response('%PDF-1.7'));
    const url = 'https://canvas.example.dev/files/3/download?download_frd=1';
    const buffer = await new CanvasApiClient().downloadFile({
      id: 3,
      display_name: 'a.pdf',
      url,
    } as never);
    expect(buffer.toString()).toBe('%PDF-1.7');
    expect(fetchMock.mock.calls[0][0]).toBe(url);
  });
});

describe('CanvasApiClient errors and token check', () => {
  const saved = { ...process.env };
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    process.env.CANVAS_API_URL = 'https://canvas.example';
    process.env.CANVAS_API_TOKEN = 'test-token';
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });
  afterEach(() => {
    fetchMock.mockRestore();
    process.env = { ...saved };
  });

  it('throws CanvasApiError carrying the HTTP status', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('Expired access token', { status: 401 }),
    );
    await expect(
      new CanvasApiClient().listModules('context-1'),
    ).rejects.toMatchObject({
      canvasStatus: 401,
      message: expect.stringContaining('HTTP 401'),
    });
  });

  it('reports a valid token', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"id":12}'));
    const result = await new CanvasApiClient().checkToken();
    expect(result).toMatchObject({ ok: true, http_status: 200 });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://canvas.example/api/v1/users/self',
    );
    expect(Number.isNaN(Date.parse(result.checked_at))).toBe(false);
  });

  it('reports a rejected token without throwing', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('Expired access token', { status: 401 }),
    );
    await expect(new CanvasApiClient().checkToken()).resolves.toMatchObject({
      ok: false,
      http_status: 401,
      message: 'Token Canvas hết hạn hoặc không hợp lệ',
    });
  });

  it('reports an unreachable Canvas without throwing', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(new CanvasApiClient().checkToken()).resolves.toMatchObject({
      ok: false,
      http_status: null,
      message: 'Không kết nối được Canvas',
    });
    fetchMock.mockResolvedValueOnce(
      new Response('bad gateway', { status: 502 }),
    );
    await expect(new CanvasApiClient().checkToken()).resolves.toMatchObject({
      ok: false,
      http_status: 502,
      message: 'Không kết nối được Canvas',
    });
  });

  it('reports a missing configuration', async () => {
    delete process.env.CANVAS_API_TOKEN;
    await expect(new CanvasApiClient().checkToken()).resolves.toMatchObject({
      ok: false,
      http_status: null,
    });
  });
});

describe('CanvasApiClient setAssignmentAllowedAttempts', () => {
  const saved = { ...process.env };
  let fetchMock: jest.SpyInstance;
  const echo = (allowed_attempts: unknown) =>
    new Response(JSON.stringify({ id: 42, allowed_attempts }));

  beforeEach(() => {
    process.env.CANVAS_API_URL = 'https://canvas.example';
    process.env.CANVAS_API_TOKEN = 'test-token';
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });
  afterEach(() => {
    fetchMock.mockRestore();
    process.env = { ...saved };
  });

  it('PUTs the limit as JSON without following redirects and with a short timeout', async () => {
    fetchMock.mockResolvedValueOnce(echo(2));
    await new CanvasApiClient().setAssignmentAllowedAttempts('8', '42', 2);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://canvas.example/api/v1/courses/8/assignments/42');
    expect(init).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ assignment: { allowed_attempts: 2 } }),
      redirect: 'manual',
      headers: expect.objectContaining({
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      }),
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('addresses the course by LTI context id when there is no numeric id', async () => {
    fetchMock.mockResolvedValueOnce(echo(1));
    await new CanvasApiClient().setAssignmentAllowedAttempts(
      'lti_context_id:abc',
      '42',
      1,
    );
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://canvas.example/api/v1/courses/lti_context_id%3Aabc/assignments/42',
    );
  });

  it('fails when Canvas does not echo the limit that was set', async () => {
    fetchMock.mockResolvedValueOnce(echo(-1));
    await expect(
      new CanvasApiClient().setAssignmentAllowedAttempts('8', '42', 2),
    ).rejects.toThrow('không xác nhận');
    fetchMock.mockResolvedValueOnce(new Response('not json'));
    await expect(
      new CanvasApiClient().setAssignmentAllowedAttempts('8', '42', 2),
    ).rejects.toThrow('không xác nhận');
  });

  it('reports the HTTP status without copying the response body into the error', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('secret detail', { status: 403 }),
    );
    const error = await new CanvasApiClient()
      .setAssignmentAllowedAttempts('8', '42', 2)
      .catch((e: unknown) => e);
    expect(error).toMatchObject({ canvasStatus: 403 });
    expect((error as Error).message).toContain('HTTP 403');
    expect((error as Error).message).not.toContain('secret detail');
  });

  it('treats a redirect response as a failure instead of following it', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 302 }));
    await expect(
      new CanvasApiClient().setAssignmentAllowedAttempts('8', '42', 2),
    ).rejects.toMatchObject({ canvasStatus: 302 });
  });

  it('wraps network failures and rejects invalid arguments before any request', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(
      new CanvasApiClient().setAssignmentAllowedAttempts('8', '42', 2),
    ).rejects.toThrow('Không kết nối được Canvas');
    fetchMock.mockClear();
    await expect(
      new CanvasApiClient().setAssignmentAllowedAttempts('8', '4/2', 2),
    ).rejects.toThrow('không hợp lệ');
    await expect(
      new CanvasApiClient().setAssignmentAllowedAttempts('8', '42', 0),
    ).rejects.toThrow('không hợp lệ');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('CanvasApiClient QTI import (question bank export)', () => {
  const saved = { ...process.env };
  let fetchMock: jest.SpyInstance;
  const zipData = Buffer.from('PK\u0005\u0006');

  beforeEach(() => {
    process.env.CANVAS_API_URL = 'http://canvas.docker:3000';
    process.env.LTI_PLATFORM_URL = 'https://canvas.example.dev';
    process.env.CANVAS_API_TOKEN = 'test-token';
    delete process.env.CANVAS_PUBLIC_URL;
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });
  afterEach(() => {
    fetchMock.mockRestore();
    process.env = { ...saved };
  });

  function createdMigration(uploadUrl: string) {
    return new Response(
      JSON.stringify({
        id: 77,
        progress_url: 'https://canvas.example.dev/api/v1/progress/9',
        pre_attachment: {
          upload_url: uploadUrl,
          upload_params: { Policy: 'p', Signature: 's' },
          file_param: 'file',
        },
      }),
    );
  }

  it('creates the migration with overwrite_quizzes, uploads without the token, then confirms with it', async () => {
    fetchMock
      .mockResolvedValueOnce(
        createdMigration('https://canvas.example.dev/files_api'),
      )
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: {
            Location:
              'https://canvas.example.dev/api/v1/files/5/create_success?uuid=u',
          },
        }),
      )
      .mockResolvedValueOnce(new Response('{"id":5}'));

    const result = await new CanvasApiClient().startQtiImport(
      42,
      'da-bank-1.zip',
      zipData,
    );
    expect(result).toEqual({
      migrationId: 77,
      progressUrl: 'https://canvas.example.dev/api/v1/progress/9',
    });

    const [createUrl, createInit] = fetchMock.mock.calls[0] as [
      string,
      RequestInit,
    ];
    expect(createUrl).toBe(
      'http://canvas.docker:3000/api/v1/courses/42/content_migrations',
    );
    expect(createInit.method).toBe('POST');
    expect(JSON.parse(createInit.body as string)).toEqual({
      migration_type: 'qti_converter',
      settings: { overwrite_quizzes: true },
      pre_attachment: {
        name: 'da-bank-1.zip',
        size: zipData.length,
        content_type: 'application/zip',
      },
    });

    const [uploadUrl, uploadInit] = fetchMock.mock.calls[1] as [
      string,
      RequestInit,
    ];
    expect(uploadUrl).toBe('http://canvas.docker:3000/files_api');
    expect(uploadInit.headers).toBeUndefined();
    expect(uploadInit.redirect).toBe('manual');
    const form = uploadInit.body as FormData;
    expect([...form.keys()]).toEqual(['Policy', 'Signature', 'file']);

    const [confirmUrl, confirmInit] = fetchMock.mock.calls[2] as [
      string,
      RequestInit,
    ];
    expect(confirmUrl).toBe(
      'http://canvas.docker:3000/api/v1/files/5/create_success?uuid=u',
    );
    expect((confirmInit.headers as Record<string, string>).Authorization).toBe(
      'Bearer test-token',
    );
  });

  it('accepts a 201 upload without a confirmation step', async () => {
    fetchMock
      .mockResolvedValueOnce(createdMigration('https://s3.example/bucket'))
      .mockResolvedValueOnce(new Response('{}', { status: 201 }));
    await new CanvasApiClient().startQtiImport(42, 'a.zip', zipData);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe('https://s3.example/bucket');
  });

  it('never sends the token to a confirmation link outside Canvas', async () => {
    fetchMock
      .mockResolvedValueOnce(createdMigration('https://s3.example/bucket'))
      .mockResolvedValueOnce(
        new Response(null, {
          status: 303,
          headers: { Location: 'https://evil.example/confirm' },
        }),
      );
    await expect(
      new CanvasApiClient().startQtiImport(42, 'a.zip', zipData),
    ).rejects.toThrow('không thuộc Canvas');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fails clearly when Canvas gives no upload slot or the upload is rejected', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 1, progress_url: 'x' })),
    );
    await expect(
      new CanvasApiClient().startQtiImport(42, 'a.zip', zipData),
    ).rejects.toThrow('không trả chỗ tải gói QTI');

    fetchMock
      .mockResolvedValueOnce(
        createdMigration('https://canvas.example.dev/files_api'),
      )
      .mockResolvedValueOnce(new Response('bad policy', { status: 400 }));
    await expect(
      new CanvasApiClient().startQtiImport(42, 'a.zip', zipData),
    ).rejects.toThrow('HTTP 400 khi tải gói QTI lên: bad policy');
  });

  it('reads progress through the internal address and refuses foreign progress links', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{"workflow_state":"completed"}'),
    );
    const client = new CanvasApiClient();
    await expect(
      client.getProgress('https://canvas.example.dev/api/v1/progress/9'),
    ).resolves.toEqual({ workflow_state: 'completed' });
    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://canvas.docker:3000/api/v1/progress/9',
    );
    await expect(
      client.getProgress('https://evil.example/api/v1/progress/9'),
    ).rejects.toThrow('không thuộc Canvas');
  });

  it('lists the question banks of a course and the questions of a bank', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('[{"id":3,"title":"B"}]'))
      .mockResolvedValueOnce(
        new Response('[{"id":8,"question_name":"L.O.1 #x"}]'),
      );
    const client = new CanvasApiClient();
    await expect(client.listQuestionBanks(42)).resolves.toEqual([
      { id: 3, title: 'B' },
    ]);
    await expect(client.listBankQuestions(3)).resolves.toEqual([
      { id: 8, question_name: 'L.O.1 #x' },
    ]);
    expect(fetchMock.mock.calls[0][0]).toBe(
      'http://canvas.docker:3000/api/v1/question_banks?context_type=Course&context_id=42&include_question_count=true&per_page=100',
    );
    expect(fetchMock.mock.calls[1][0]).toBe(
      'http://canvas.docker:3000/api/v1/question_banks/3/questions?per_page=100',
    );
  });

  it('records the public Canvas address, not the internal one, as the LMS identity', () => {
    expect(new CanvasApiClient().lmsBaseUrl()).toBe(
      'https://canvas.example.dev',
    );
    process.env.CANVAS_PUBLIC_URL = 'https://canvas.public.dev/';
    expect(new CanvasApiClient().lmsBaseUrl()).toBe(
      'https://canvas.public.dev',
    );
  });
});
