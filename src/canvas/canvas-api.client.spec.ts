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
      toInternalCanvasUrl('https://canvas.example.dev/api/v1/courses/1/files?page=2&per_page=100', env),
    ).toBe('http://canvas.docker:3000/api/v1/courses/1/files?page=2&per_page=100');
    expect(toInternalCanvasUrl('https://canvas-public.example.dev/files/3/download?download_frd=1', env)).toBe(
      'http://canvas.docker:3000/files/3/download?download_frd=1',
    );
  });

  it('matches the public host regardless of scheme, since Canvas redirects with http', () => {
    expect(toInternalCanvasUrl('http://canvas.example.dev/files/3/download?sf_verifier=abc', env)).toBe(
      'http://canvas.docker:3000/files/3/download?sf_verifier=abc',
    );
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
    expect(fetchMock.mock.calls[0][0]).toMatch(/^http:\/\/canvas\.docker:3000\/api\/v1\/courses\//);
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
    fetchMock.mockResolvedValueOnce(new Response('Expired access token', { status: 401 }));
    await expect(new CanvasApiClient().listModules('context-1')).rejects.toMatchObject({
      canvasStatus: 401,
      message: expect.stringContaining('HTTP 401'),
    });
  });

  it('reports a valid token', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"id":12}'));
    const result = await new CanvasApiClient().checkToken();
    expect(result).toMatchObject({ ok: true, http_status: 200 });
    expect(fetchMock.mock.calls[0][0]).toBe('https://canvas.example/api/v1/users/self');
    expect(Number.isNaN(Date.parse(result.checked_at))).toBe(false);
  });

  it('reports a rejected token without throwing', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Expired access token', { status: 401 }));
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
    fetchMock.mockResolvedValueOnce(new Response('bad gateway', { status: 502 }));
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
