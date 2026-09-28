import { CanvasApiClient } from './canvas-api.client';

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
