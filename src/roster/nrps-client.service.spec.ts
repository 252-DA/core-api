import { AgsTokenError } from '../ags/ags-token.service';
import type { AgsConfig } from '../config/ags.config';
import {
  NRPS_SCOPE,
  NRPS_UNAUTHORIZED_MESSAGE,
  NrpsClientService,
  NrpsError,
} from './nrps-client.service';

const URL_ = 'https://canvas.test/api/lti/courses/8/names_and_roles';
const config = { requestTimeoutMs: 5000 } as AgsConfig;

const member = (id: string, extra: Record<string, unknown> = {}) => ({
  user_id: id,
  status: 'Active',
  name: `Name ${id}`,
  roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'],
  ...extra,
});

function page(
  members: unknown[],
  link?: string,
  init: ResponseInit = { status: 200 },
) {
  return new Response(JSON.stringify({ members }), {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(link ? { Link: link } : {}) },
  });
}

describe('NrpsClientService', () => {
  const env = process.env.LTI_PLATFORM_URL;
  let tokens: { getAccessToken: jest.Mock; invalidate: jest.Mock };
  let service: NrpsClientService;
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    process.env.LTI_PLATFORM_URL = 'https://canvas.test';
    tokens = {
      getAccessToken: jest.fn().mockResolvedValue('tok-1'),
      invalidate: jest.fn(),
    };
    service = new NrpsClientService(tokens as never, config);
    fetchMock = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (env === undefined) delete process.env.LTI_PLATFORM_URL;
    else process.env.LTI_PLATFORM_URL = env;
  });

  it('gửi bearer token đúng scope, Accept của NRPS và giới hạn trang', async () => {
    fetchMock.mockResolvedValueOnce(page([member('a')]));
    await service.listMembers(URL_);
    expect(tokens.getAccessToken).toHaveBeenCalledWith(NRPS_SCOPE);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`${URL_}?limit=100`);
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer tok-1',
      Accept: 'application/vnd.ims.lti-nrps.v2.membershipcontainer+json',
    });
  });

  it('đọc hết các trang qua Link rel="next" và chỉ lấy trường cần dùng', async () => {
    const next = `${URL_}?limit=100&page=2`;
    fetchMock
      .mockResolvedValueOnce(
        page(
          [member('a'), { name: 'không có user_id', roles: [] }],
          `<${URL_}?limit=100&page=1>; rel="current", <${next}>; rel="next", <${URL_}?page=3>; rel="last"`,
        ),
      )
      .mockResolvedValueOnce(
        page([member('b', { given_name: 'B', family_name: 'C', email: 'b@x.test', picture: 'https://x/p.png' })]),
      );
    const members = await service.listMembers(URL_);
    expect(members.map((m) => m.user_id)).toEqual(['a', 'b']);
    expect(String(fetchMock.mock.calls[1][0])).toBe(next);
    expect(members[1]).toEqual({
      user_id: 'b',
      status: 'Active',
      name: 'Name b',
      given_name: 'B',
      family_name: 'C',
      email: 'b@x.test',
      roles: ['http://purl.imsglobal.org/vocab/lis/v2/membership#Learner'],
    });
  });

  it('401 thì bỏ token đã cache rồi thử lại đúng một lần', async () => {
    tokens.getAccessToken.mockResolvedValueOnce('old').mockResolvedValueOnce('new');
    fetchMock
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
      .mockResolvedValueOnce(page([member('a')]));
    const members = await service.listMembers(URL_);
    expect(members).toHaveLength(1);
    expect(tokens.invalidate).toHaveBeenCalledTimes(1);
    expect(tokens.invalidate).toHaveBeenCalledWith(NRPS_SCOPE);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe('Bearer new');
  });

  it('401 lần hai thì báo lỗi tiếng Việt, không thử lại nữa', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 401 }));
    await expect(service.listMembers(URL_)).rejects.toThrow(NRPS_UNAUTHORIZED_MESSAGE);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(tokens.invalidate).toHaveBeenCalledTimes(1);
  });

  it('HTTP lỗi khác 401 báo mã trạng thái', async () => {
    fetchMock.mockResolvedValueOnce(new Response('boom', { status: 500 }));
    const error = await service.listMembers(URL_).catch((e) => e);
    expect(error).toBeInstanceOf(NrpsError);
    expect(error.message).toContain('HTTP 500');
    expect(error.nrpsStatus).toBe(500);
  });

  it('không kết nối được Canvas', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(service.listMembers(URL_)).rejects.toThrow('Không kết nối được Canvas');
  });

  it('không xin được token thì báo nguyên nhân', async () => {
    tokens.getAccessToken.mockRejectedValue(new AgsTokenError('LTI_PRIVATE_KEY_PATH chưa được cấu hình', 0));
    await expect(service.listMembers(URL_)).rejects.toThrow('Chưa cấu hình khóa LTI');
    tokens.getAccessToken.mockRejectedValue(new AgsTokenError('x', 400));
    await expect(service.listMembers(URL_)).rejects.toThrow('mã 400');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('JSON hỏng hoặc thiếu members', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>', { status: 200 }));
    await expect(service.listMembers(URL_)).rejects.toThrow('không phải JSON');
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 200 }));
    await expect(service.listMembers(URL_)).rejects.toThrow('thiếu trường members');
  });

  it('không gửi token tới host khác Canvas đã cấu hình', async () => {
    await expect(service.listMembers('https://evil.test/api/lti/courses/1/names_and_roles')).rejects.toThrow(
      'không thuộc Canvas',
    );
    await expect(service.listMembers('not a url')).rejects.toThrow('không hợp lệ');
    expect(tokens.getAccessToken).not.toHaveBeenCalled();
  });

  it('không theo link trang kế tiếp sang host lạ', async () => {
    fetchMock.mockResolvedValueOnce(
      page([member('a')], '<https://evil.test/steal?page=2>; rel="next"'),
    );
    await expect(service.listMembers(URL_)).rejects.toThrow('host lạ');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('dừng khi Canvas trả Link next vô tận', async () => {
    fetchMock.mockImplementation(async () => page([member('a')], `<${URL_}?page=2>; rel="next"`));
    await expect(service.listMembers(URL_)).rejects.toThrow('quá dài');
  });
});
