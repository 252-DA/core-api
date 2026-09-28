import { generateKeyPairSync } from 'node:crypto';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decodeJwt, decodeProtectedHeader } from 'jose';
import { AgsTokenService } from './ags-token.service';
import { AGS_SCORE_SCOPE, type AgsConfig } from './ags.config';

const TOKEN_URL = 'https://canvas.test/login/oauth2/token';

function writeKey(): string {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  const path = join(mkdtempSync(join(tmpdir(), 'ags-key-')), 'lti.pem');
  writeFileSync(path, pem);
  return path;
}

function config(privateKeyPath: string): AgsConfig {
  return {
    enabled: true,
    clientId: 'client-abc',
    keyId: 'kid-1',
    privateKeyPath,
    tokenUrl: TOKEN_URL,
    pollIntervalMs: 15000,
    batchSize: 200,
    requestTimeoutMs: 5000,
    maxRetries: 3,
    backoffBaseMs: 1000,
    backoffMaxMs: 10000,
    unpublishedRetryMs: 5000,
  };
}

function tokenResponse(accessToken: string, expiresIn = 3600) {
  return new Response(
    JSON.stringify({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresIn,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

describe('AgsTokenService', () => {
  let keyPath: string;

  beforeAll(() => {
    keyPath = writeKey();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('đổi client assertion đã ký lấy access token', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(tokenResponse('at-1'));
    const service = new AgsTokenService(config(keyPath));

    expect(await service.getAccessToken(AGS_SCORE_SCOPE)).toBe('at-1');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(TOKEN_URL);
    const body = new URLSearchParams(init?.body as string);
    expect(body.get('grant_type')).toBe('client_credentials');
    expect(body.get('client_assertion_type')).toBe(
      'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    );
    expect(body.get('scope')).toBe(AGS_SCORE_SCOPE);

    const assertion = body.get('client_assertion') as string;
    expect(decodeProtectedHeader(assertion)).toMatchObject({
      alg: 'RS256',
      kid: 'kid-1',
    });
    // iss/sub là client_id, aud là token endpoint — theo IMS Security Framework.
    expect(decodeJwt(assertion)).toMatchObject({
      iss: 'client-abc',
      sub: 'client-abc',
      aud: TOKEN_URL,
    });
  });

  it('dùng lại token đã cache thay vì xin token mới mỗi lần', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(tokenResponse('at-1'));
    const service = new AgsTokenService(config(keyPath));

    await service.getAccessToken(AGS_SCORE_SCOPE);
    await service.getAccessToken(AGS_SCORE_SCOPE);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('xin token mới sau khi invalidate', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(tokenResponse('at-1'))
      .mockResolvedValueOnce(tokenResponse('at-2'));
    const service = new AgsTokenService(config(keyPath));

    await service.getAccessToken(AGS_SCORE_SCOPE);
    service.invalidate(AGS_SCORE_SCOPE);

    expect(await service.getAccessToken(AGS_SCORE_SCOPE)).toBe('at-2');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('không cache token sắp hết hạn', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(tokenResponse('at-1', 30))
      .mockResolvedValueOnce(tokenResponse('at-2', 3600));
    const service = new AgsTokenService(config(keyPath));

    await service.getAccessToken(AGS_SCORE_SCOPE);
    expect(await service.getAccessToken(AGS_SCORE_SCOPE)).toBe('at-2');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('ném lỗi khi token endpoint trả lỗi', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('bad client', { status: 401 }));
    const service = new AgsTokenService(config(keyPath));

    await expect(service.getAccessToken(AGS_SCORE_SCOPE)).rejects.toThrow(
      /HTTP 401/,
    );
  });
});
