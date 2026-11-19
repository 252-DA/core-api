import { LtiServicesClient } from './lti-services.client';
import { ASSET_SCOPE, REPORT_SCOPE } from './essay-grading';

describe('LtiServicesClient platform URLs', () => {
  const originalPlatform = process.env.LTI_PLATFORM_URL;

  afterEach(() => {
    if (originalPlatform === undefined) delete process.env.LTI_PLATFORM_URL;
    else process.env.LTI_PLATFORM_URL = originalPlatform;
    jest.restoreAllMocks();
  });

  function setup(platform = 'https://canvas.example') {
    process.env.LTI_PLATFORM_URL = platform;
    const tokens = {
      getAccessToken: jest.fn().mockResolvedValue('test-token'),
      invalidate: jest.fn(),
    };
    const client = new LtiServicesClient(
      tokens as never,
      { requestTimeoutMs: 1000 } as never,
    );
    const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Essay body', {
        headers: { 'Content-Type': 'text/plain' },
      }),
    );
    return { client, tokens, fetch };
  }

  it('accepts Canvas HTTP URLs from background notices and downloads over configured HTTPS', async () => {
    const { client, tokens, fetch } = setup();
    const url =
      'http://canvas.example/api/lti/asset_processors/1/assets/a1?attempt=2';

    expect(client.isPlatformUrl(url)).toBe(true);
    const file = await client.downloadAsset(url);

    expect(file.content.toString()).toBe('Essay body');
    expect(tokens.getAccessToken).toHaveBeenCalledWith(ASSET_SCOPE);
    expect(fetch).toHaveBeenCalledWith(
      'https://canvas.example/api/lti/asset_processors/1/assets/a1?attempt=2',
      expect.objectContaining({ method: 'GET' }),
    );
    expect(fetch.mock.calls[0][1]?.headers).toMatchObject({
      Authorization: 'Bearer test-token',
    });
  });

  it('sends reports over HTTPS even when Canvas supplies an HTTP report URL', async () => {
    const { client, tokens, fetch } = setup();
    await client.postReport(
      'http://canvas.example/api/lti/asset_processors/1/reports',
      { result: '8/10' },
    );

    expect(tokens.getAccessToken).toHaveBeenCalledWith(REPORT_SCOPE);
    expect(fetch).toHaveBeenCalledWith(
      'https://canvas.example/api/lti/asset_processors/1/reports',
      expect.objectContaining({ method: 'POST', body: '{"result":"8/10"}' }),
    );
  });

  it.each([
    'http://evil.example/assets/a1',
    'https://canvas.example.evil.example/assets/a1',
    'http://canvas.example:8080/assets/a1',
    'https://canvas.example:8443/assets/a1',
    'http://user:password@canvas.example/assets/a1',
    'ftp://canvas.example/assets/a1',
  ])(
    'rejects untrusted host, port or credentials before fetching: %s',
    async (url) => {
      const { client, tokens, fetch } = setup();
      expect(client.isPlatformUrl(url)).toBe(false);
      await expect(client.downloadAsset(url)).rejects.toThrow(
        'không thuộc LTI_PLATFORM_URL',
      );
      expect(tokens.getAccessToken).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it('preserves explicitly configured HTTP development origins', async () => {
    const { client, fetch } = setup('http://localhost:3000');
    await client.downloadAsset('http://localhost:3000/assets/a1');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/assets/a1',
      expect.any(Object),
    );
    expect(client.isPlatformUrl('https://localhost:3000/assets/a1')).toBe(
      false,
    );
  });

  it('requires an exact origin when HTTPS uses a custom port', () => {
    const { client } = setup('https://canvas.example:8443');
    expect(client.isPlatformUrl('https://canvas.example:8443/assets/a1')).toBe(
      true,
    );
    expect(client.isPlatformUrl('http://canvas.example/assets/a1')).toBe(false);
    expect(client.isPlatformUrl('http://canvas.example:8443/assets/a1')).toBe(
      false,
    );
  });
});
