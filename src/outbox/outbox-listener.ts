import { Logger } from '@nestjs/common';
import { errorMessage } from '../common/utils/errors';

/**
 * Phần của `pg.Client` mà listener dùng. Tách thành interface để test thay
 * bằng client giả, và vì `pg` không kèm type (@types/pg không được hoist
 * trong node_modules của core-api).
 */
export interface ListenClient {
  connect(): Promise<unknown>;
  query(sql: string): Promise<unknown>;
  end(): Promise<unknown>;
  on(
    event: 'notification',
    listener: (message: { channel: string }) => void,
  ): unknown;
  on(event: 'error', listener: (err: Error) => void): unknown;
  on(event: 'end', listener: () => void): unknown;
}

export type ListenClientFactory = () => ListenClient;

type PgModule = {
  Client: new (config: {
    connectionString?: string;
    application_name?: string;
    keepAlive?: boolean;
    connectionTimeoutMillis?: number;
  }) => ListenClient;
};

/**
 * Kết nối riêng ngoài pool của Prisma: LISTEN gắn với một phiên, phiên đó phải
 * sống suốt đời tiến trình. keepAlive để TCP chết im lặng (mất mạng Tailscale)
 * cũng thành sự kiện 'error' và được nối lại.
 */
export function createPgListenClient(
  connectionString = process.env.DATABASE_URL,
): ListenClient {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Client } = require('pg') as PgModule;
  return new Client({
    connectionString,
    application_name: 'core-api-outbox-listener',
    keepAlive: true,
    // Mặc định pg chờ connect vô hạn: DB mất mạng thì kẹt, không nối lại được.
    connectionTimeoutMillis: 10_000,
  });
}

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const END_TIMEOUT_MS = 2_000;

/**
 * Giữ một phiên `LISTEN <channel>`, tự nối lại (backoff tới 30s) khi mất kết
 * nối. Mỗi lần LISTEN thành công gọi `onConnected`: trong lúc mất kết nối có
 * thể đã lỡ notify, bên dùng nên poll bù.
 */
export class OutboxListener {
  private readonly logger = new Logger(OutboxListener.name);
  private client: ListenClient | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private failures = 0;
  private stopped = false;

  constructor(
    private readonly channel: string,
    private readonly createClient: ListenClientFactory,
    private readonly onNotify: () => void,
    private readonly onConnected: () => void,
  ) {}

  get connected() {
    return this.client !== null;
  }

  start(): Promise<void> {
    this.stopped = false;
    return this.connect();
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    const client = this.client;
    this.client = null;
    if (client) await endQuietly(client);
  }

  private async connect(): Promise<void> {
    if (this.stopped) return;
    let client: ListenClient;
    try {
      client = this.createClient();
    } catch (err) {
      this.logger.error(`Không tạo được client LISTEN: ${errorMessage(err)}`);
      this.scheduleReconnect();
      return;
    }

    let lost = false;
    const onLost = (err?: unknown) => {
      if (lost) return;
      lost = true;
      if (this.client === client) this.client = null;
      void endQuietly(client);
      if (this.stopped) return;
      this.logger.warn(
        `Mất LISTEN ${this.channel}${err ? `: ${errorMessage(err)}` : ''}; poll dự phòng vẫn chạy, đang nối lại`,
      );
      this.scheduleReconnect();
    };
    client.on('notification', (message) => {
      if (message.channel === this.channel) this.onNotify();
    });
    client.on('error', onLost);
    client.on('end', () => onLost());

    try {
      await client.connect();
      // channel là hằng số định danh của code, không phải dữ liệu người dùng.
      await client.query(`LISTEN ${this.channel}`);
    } catch (err) {
      onLost(err);
      return;
    }
    if (lost) return;
    if (this.stopped) {
      await endQuietly(client);
      return;
    }
    this.client = client;
    this.failures = 0;
    this.logger.log(`Đang LISTEN ${this.channel}`);
    this.onConnected();
  }

  private scheduleReconnect() {
    if (this.stopped || this.reconnectTimer) return;
    const delay = Math.min(
      RECONNECT_MAX_MS,
      RECONNECT_BASE_MS * 2 ** this.failures,
    );
    this.failures += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delay);
    this.reconnectTimer.unref?.();
  }
}

/**
 * end() của pg có thể không bao giờ resolve khi socket đã chết trước đó; không
 * để việc đóng kết nối cũ chặn tắt tiến trình hay nối lại.
 */
async function endQuietly(client: ListenClient) {
  let timer: NodeJS.Timeout | undefined;
  await Promise.race([
    client.end().catch(() => undefined),
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, END_TIMEOUT_MS);
      timer.unref?.();
    }),
  ]);
  if (timer) clearTimeout(timer);
}
