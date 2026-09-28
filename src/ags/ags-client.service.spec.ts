import { AgsClientService } from './ags-client.service';
import { AGS_SCORE_SCOPE, type AgsConfig } from './ags.config';

describe('AgsClientService', () => {
  const config = { requestTimeoutMs: 5000 } as AgsConfig;

  function setup() {
    const tokenService = {
      getAccessToken: jest.fn().mockResolvedValue('token-1'),
      invalidate: jest.fn(),
    };
    const service = new AgsClientService(config, tokenService as never);
    return { service, tokenService };
  }

  const payload = {
    userId: 'lms-sub-1',
    scoreGiven: 80,
    scoreMaximum: 100,
    timestamp: '2026-08-25T10:00:00.000Z',
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('scoresUrl', () => {
    it('chèn /scores vào pathname và giữ nguyên query string', () => {
      expect(
        AgsClientService.scoresUrl(
          'https://canvas.test/api/lti/courses/1/line_items/9?type=inline',
        ),
      ).toBe(
        'https://canvas.test/api/lti/courses/1/line_items/9/scores?type=inline',
      );
    });

    it('không sinh dấu gạch chéo kép khi URL có sẵn slash cuối', () => {
      expect(
        AgsClientService.scoresUrl(
          'https://moodle.test/mod/lti/services.php/2/lineitems/7/',
        ),
      ).toBe('https://moodle.test/mod/lti/services.php/2/lineitems/7/scores');
    });
  });

  it('gửi score đúng content-type và body theo LTI-AGS', async () => {
    const { service, tokenService } = setup();
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('', { status: 200 }));

    const result = await service.postScore(
      'https://canvas.test/line_items/9',
      payload,
    );

    expect(result).toEqual({ ok: true });
    expect(tokenService.getAccessToken).toHaveBeenCalledWith(AGS_SCORE_SCOPE);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://canvas.test/line_items/9/scores');
    const headers = init?.headers as Record<string, string>;
    expect(headers['Content-Type']).toBe(
      'application/vnd.ims.lis.v1.score+json',
    );
    expect(headers.Authorization).toBe('Bearer token-1');
    expect(JSON.parse(init?.body as string)).toEqual({
      userId: 'lms-sub-1',
      scoreGiven: 80,
      scoreMaximum: 100,
      timestamp: '2026-08-25T10:00:00.000Z',
      activityProgress: 'Completed',
      gradingProgress: 'FullyGraded',
    });
  });

  it('làm mới token và thử lại đúng một lần khi platform trả 401', async () => {
    const { service, tokenService } = setup();
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('expired', { status: 401 }))
      .mockResolvedValueOnce(new Response('', { status: 200 }));

    const result = await service.postScore(
      'https://canvas.test/line_items/9',
      payload,
    );

    expect(result).toEqual({ ok: true });
    expect(tokenService.invalidate).toHaveBeenCalledWith(AGS_SCORE_SCOPE);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('coi 5xx là lỗi tạm thời để poller thử lại', async () => {
    const { service } = setup();
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('boom', { status: 503 }));

    const result = await service.postScore(
      'https://canvas.test/line_items/9',
      payload,
    );

    expect(result).toMatchObject({ ok: false, retryable: true });
  });

  it('coi 404 là lỗi vĩnh viễn — line item không còn thì thử lại vô ích', async () => {
    const { service } = setup();
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('gone', { status: 404 }));

    const result = await service.postScore(
      'https://canvas.test/line_items/9',
      payload,
    );

    expect(result).toMatchObject({ ok: false, retryable: false });
  });

  it('coi 422 "still unpublished" của Canvas là chờ giảng viên publish, không phải lỗi vĩnh viễn', async () => {
    const { service } = setup();
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        '{"errors":{"type":"unprocessable_entity","message":"This assignment is still unpublished"}}',
        { status: 422 },
      ),
    );

    const result = await service.postScore(
      'https://canvas.test/line_items/9',
      payload,
    );

    expect(result).toMatchObject({
      ok: false,
      retryable: true,
      waitingForPublish: true,
    });
  });

  it('vẫn coi 422 khác là lỗi vĩnh viễn', async () => {
    const { service } = setup();
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        '{"errors":{"message":"The maximum number of allowed attempts has been reached for this submission"}}',
        { status: 422 },
      ),
    );

    const result = await service.postScore(
      'https://canvas.test/line_items/9',
      payload,
    );

    expect(result).toMatchObject({ ok: false, retryable: false });
    expect(result).not.toHaveProperty('waitingForPublish');
  });

  it('coi lỗi mạng là tạm thời', async () => {
    const { service } = setup();
    jest
      .spyOn(globalThis, 'fetch')
      .mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await service.postScore(
      'https://canvas.test/line_items/9',
      payload,
    );

    expect(result).toMatchObject({
      ok: false,
      retryable: true,
      error: 'ECONNREFUSED',
    });
  });

  it('báo lỗi vĩnh viễn khi lms_line_item_url không parse được', async () => {
    const { service } = setup();
    const fetchMock = jest.spyOn(globalThis, 'fetch');

    const result = await service.postScore('không-phải-url', payload);

    expect(result).toMatchObject({ ok: false, retryable: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
