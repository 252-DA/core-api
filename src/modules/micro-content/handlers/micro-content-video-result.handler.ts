import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { runBestEffort } from '../../../common/utils/best-effort';
import {
  clipCodePoints,
  isWithinCodePoints,
} from '../../../common/utils/text-length';
import { isUuid } from '../../../common/utils/uuid';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import {
  InvalidWorkerResultError,
  type WorkerResultEnvelope,
} from '../../../messaging/worker-results/worker-result-envelope';
import { WorkerResultHandler } from '../../../messaging/worker-results/worker-result-handler';

interface VideoResultBase {
  micro_content_id: string;
  asset_id: string;
  render_id: string;
}

export interface SceneTimelineItem {
  scene_index: number;
  title: string;
  start_ms: number;
  end_ms: number;
  duration_ms: number;
  slide_page?: number;
}

export interface MicroContentVideoReady extends VideoResultBase {
  status: 'READY';
  object_key: string;
  duration_ms: number;
  size_bytes: number;
  mime_type: string;
  vtt_object_key?: string;
  transcript_text?: string;
  scene_timeline?: SceneTimelineItem[];
}

export interface MicroContentVideoFailed extends VideoResultBase {
  status: 'FAILED';
  error: string;
}

/** contracts/integration-events/v1/micro-content-video-result.json */
export type MicroContentVideoResultPayload =
  | MicroContentVideoReady
  | MicroContentVideoFailed;

/** Thứ apply() cần: micro_content_id chỉ để đối chiếu log, không dùng khi ghi. */
type VideoResultToApply =
  | Omit<MicroContentVideoReady, 'micro_content_id'>
  | Omit<MicroContentVideoFailed, 'micro_content_id'>;

export type MicroContentVideoApplyOutcome =
  | { applied: true; status: 'READY' | 'FAILED'; microContents: number }
  | {
      applied: false;
      reason: 'superseded' | 'already_applied' | 'asset_missing';
    };

const MIME = /^video\/[a-z0-9.+-]+$/;
const BASE_KEYS = ['micro_content_id', 'asset_id', 'render_id', 'status'];
const READY_KEYS = new Set([
  ...BASE_KEYS,
  'object_key',
  'duration_ms',
  'size_bytes',
  'mime_type',
  'vtt_object_key',
  'transcript_text',
  'scene_timeline',
]);
const FAILED_KEYS = new Set([...BASE_KEYS, 'error']);
// Giới hạn theo cột: video_duration_ms/duration_ms là INTEGER, object_key
// VARCHAR(512). size_bytes là BIGINT nhưng JSON chỉ chở chính xác tới 2^53.
const MAX_INT4 = 2_147_483_647;
const MAX_OBJECT_KEY = 512;
const MAX_MIME = 100;
const MAX_ERROR = 1000;
const MAX_TRANSCRIPT = 200_000;
const MAX_TIMELINE_SCENES = 100;

function isNonNegativeInt(value: unknown, max: number): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= max
  );
}

function validateSceneTimeline(raw: unknown, problems: string[]) {
  if (!Array.isArray(raw) || raw.length > MAX_TIMELINE_SCENES) {
    problems.push(
      `scene_timeline must be an array of at most ${MAX_TIMELINE_SCENES} items`,
    );
    return;
  }
  raw.forEach((entry, idx) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      problems.push(`scene_timeline[${idx}] must be an object`);
      return;
    }
    const e = entry as Record<string, unknown>;
    if (!isNonNegativeInt(e.scene_index, MAX_TIMELINE_SCENES)) {
      problems.push(
        `scene_timeline[${idx}].scene_index must be a non-negative integer`,
      );
    }
    if (typeof e.title !== 'string' || !e.title.trim()) {
      problems.push(`scene_timeline[${idx}].title must be a non-empty string`);
    }
    if (
      !isNonNegativeInt(e.start_ms, MAX_INT4) ||
      !isNonNegativeInt(e.end_ms, MAX_INT4)
    ) {
      problems.push(
        `scene_timeline[${idx}].start_ms/end_ms must be non-negative integers`,
      );
    } else if (e.end_ms < e.start_ms) {
      problems.push(`scene_timeline[${idx}].end_ms must be >= start_ms`);
    }
    if (!isNonNegativeInt(e.duration_ms, MAX_INT4) || e.duration_ms < 1) {
      problems.push(`scene_timeline[${idx}].duration_ms must be >= 1`);
    }
    if (
      e.slide_page !== undefined &&
      e.slide_page !== null &&
      (!isNonNegativeInt(e.slide_page, 10_000) || e.slide_page < 1)
    ) {
      problems.push(`scene_timeline[${idx}].slide_page must be >= 1`);
    }
  });
}

/**
 * Kiểm payload đúng schema; sai thì ném InvalidWorkerResultError liệt kê mọi
 * chỗ sai. Kiểm UUID ở đây vì để Postgres từ chối thì thành lỗi DB và bị retry.
 */
export function parseMicroContentVideoPayload(
  payload: Record<string, unknown>,
  resultId: string,
): MicroContentVideoResultPayload {
  const problems: string[] = [];
  for (const key of ['micro_content_id', 'asset_id', 'render_id']) {
    const value = payload[key];
    if (!isUuid(value)) {
      problems.push(`${key} must be a UUID`);
    }
  }
  const status = payload.status;
  let allowed: Set<string> | undefined;
  if (status === 'READY') {
    allowed = READY_KEYS;
    const {
      object_key,
      duration_ms,
      size_bytes,
      mime_type,
      vtt_object_key,
      transcript_text,
      scene_timeline,
    } = payload;
    if (
      typeof object_key !== 'string' ||
      object_key.length === 0 ||
      !isWithinCodePoints(object_key, MAX_OBJECT_KEY)
    ) {
      problems.push(
        `object_key must be a string of 1..${MAX_OBJECT_KEY} chars`,
      );
    }
    if (!isNonNegativeInt(duration_ms, MAX_INT4)) {
      problems.push(`duration_ms must be an integer in 0..${MAX_INT4}`);
    }
    if (!isNonNegativeInt(size_bytes, Number.MAX_SAFE_INTEGER)) {
      problems.push('size_bytes must be a non-negative safe integer');
    }
    if (
      typeof mime_type !== 'string' ||
      !isWithinCodePoints(mime_type, MAX_MIME) ||
      !MIME.test(mime_type)
    ) {
      problems.push('mime_type must look like video/<subtype>');
    }
    if (
      vtt_object_key !== undefined &&
      (typeof vtt_object_key !== 'string' ||
        vtt_object_key.length === 0 ||
        !isWithinCodePoints(vtt_object_key, MAX_OBJECT_KEY))
    ) {
      problems.push(
        `vtt_object_key must be a string of 1..${MAX_OBJECT_KEY} chars`,
      );
    }
    if (
      transcript_text !== undefined &&
      (typeof transcript_text !== 'string' ||
        !isWithinCodePoints(transcript_text, MAX_TRANSCRIPT))
    ) {
      problems.push(
        `transcript_text must be a string of <= ${MAX_TRANSCRIPT} chars`,
      );
    }
    if (scene_timeline !== undefined) {
      validateSceneTimeline(scene_timeline, problems);
    }
  } else if (status === 'FAILED') {
    allowed = FAILED_KEYS;
    const { error } = payload;
    if (
      typeof error !== 'string' ||
      error.length === 0 ||
      !isWithinCodePoints(error, MAX_ERROR)
    ) {
      problems.push(`error must be a string of 1..${MAX_ERROR} chars`);
    }
  } else {
    problems.push(
      `status must be READY or FAILED, got ${JSON.stringify(status)}`,
    );
  }
  if (allowed) {
    const extra = Object.keys(payload).filter((key) => !allowed.has(key));
    if (extra.length) problems.push(`unexpected fields: ${extra.join(', ')}`);
  }
  if (problems.length) {
    throw new InvalidWorkerResultError(
      `invalid MICRO_CONTENT_VIDEO_RESULT ${resultId}: ${problems.join('; ')}`,
    );
  }
  return payload as unknown as MicroContentVideoResultPayload;
}

/**
 * Áp dụng MICRO_CONTENT_VIDEO_RESULT: kết quả một lần render video AI →
 * video_assets và micro_contents, trong một transaction. Worker không còn ghi
 * hai bảng này (docs/ke-hoach-ranh-gioi-du-lieu.md).
 *
 * Chống kết quả cũ: requestRender sinh render_id mới mỗi lần bấm render và ghi
 * vào video_assets.ai_render_id cùng transaction với lệnh. Chỉ áp dụng khi asset
 * còn PROCESSING và ai_render_id = render_id của kết quả; điều kiện nằm trong
 * chính câu UPDATE nên hai bản core-api chạy song song, hay requestRender chen
 * vào giữa, cũng không đè được nhau (Postgres khoá dòng asset).
 *
 * micro_contents: mọi bài đang gắn asset này và còn PROCESSING — bài đã gỡ
 * video, chuyển sang tải lên hay gắn video khác thì không bị đụng.
 */
@Injectable()
@WorkerResultHandler('MICRO_CONTENT_VIDEO_RESULT')
export class MicroContentVideoResultHandler implements WorkerResultHandler<
  Record<string, unknown>
> {
  private readonly logger = new Logger(MicroContentVideoResultHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(
    envelope: WorkerResultEnvelope<Record<string, unknown>>,
  ): Promise<MicroContentVideoApplyOutcome> {
    const result = parseMicroContentVideoPayload(
      envelope.payload,
      envelope.result_id,
    );
    const outcome = await this.apply(result);
    if (!outcome.applied) {
      this.logger.log(
        `Bỏ qua ${envelope.result_id} (asset ${result.asset_id}): ${outcome.reason}`,
      );
    }
    return outcome;
  }

  /**
   * Kết quả không bao giờ áp dụng được (payload sai, hay lỗi DB hết lượt thử):
   * asset còn PROCESSING sẽ không bao giờ READY và bài micro-content gắn nó kẹt ở
   * "đang render" mà không có nút nào gỡ. Áp dụng như nhánh FAILED của handle():
   * asset (đúng ai_render_id, còn PROCESSING) → FAILED, kèm các micro_contents
   * còn PROCESSING gắn asset đó; giảng viên bấm render lại.
   *
   * Payload chưa kiểm: chỉ đọc asset_id và render_id hợp lệ (micro_content_id
   * không dùng tới); render_id khác ai_render_id hiện tại (đã render lại) hay asset
   * đã READY/FAILED thì không đụng gì.
   */
  async onFinalFailure(
    envelope: WorkerResultEnvelope<Record<string, unknown>>,
    error: Error,
  ) {
    await runBestEffort(
      this.logger,
      `Không đánh dấu FAILED được asset của ${envelope.result_id}`,
      async () => {
        const payload: unknown = envelope.payload;
        if (typeof payload !== 'object' || payload === null) return;
        const { asset_id: assetId, render_id: renderId } = payload as Record<
          string,
          unknown
        >;
        if (!isUuid(assetId) || !isUuid(renderId)) {
          return;
        }
        const outcome = await this.apply({
          status: 'FAILED',
          asset_id: assetId,
          render_id: renderId,
          error: clipCodePoints(
            `Không lưu được kết quả render video: ${error.message}`,
            MAX_ERROR,
          ),
        });
        this.logger.warn(
          `Kết quả ${envelope.result_id} thất bại vĩnh viễn (${error.message}): ` +
            (outcome.applied
              ? `asset ${assetId} → FAILED (${outcome.microContents} bài)`
              : `asset ${assetId} giữ nguyên (${outcome.reason})`),
        );
      },
    );
  }

  private apply(
    result: VideoResultToApply,
  ): Promise<MicroContentVideoApplyOutcome> {
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const asset = await tx.video_assets.updateMany({
        where: {
          asset_id: result.asset_id,
          ai_render_id: result.render_id,
          status: 'PROCESSING',
        },
        data:
          result.status === 'READY'
            ? {
                status: 'READY',
                object_key: result.object_key,
                duration_ms: result.duration_ms,
                size_bytes: BigInt(result.size_bytes),
                mime_type: result.mime_type,
                ...(result.vtt_object_key
                  ? {
                      vtt_subtitles_key: result.vtt_object_key,
                      transcript_status: 'READY',
                    }
                  : {}),
                ...(result.transcript_text !== undefined
                  ? { transcript_text: result.transcript_text }
                  : {}),
                ...(result.scene_timeline !== undefined
                  ? {
                      scene_timeline:
                        result.scene_timeline as unknown as Prisma.InputJsonValue,
                    }
                  : {}),
                error_message: null,
                updated_at: now,
              }
            : {
                status: 'FAILED',
                error_message: result.error,
                updated_at: now,
              },
      });

      if (asset.count === 0) {
        const current = await tx.video_assets.findUnique({
          where: { asset_id: result.asset_id },
          select: { ai_render_id: true },
        });
        // Không phải lỗi: thử lại cũng không khá hơn. Asset của lần render này
        // đã có kết quả, đã được render lại, hoặc không còn.
        const reason = !current
          ? 'asset_missing'
          : current.ai_render_id !== result.render_id
            ? 'superseded'
            : 'already_applied';
        return { applied: false, reason } as const;
      }

      const lessons = await tx.micro_contents.updateMany({
        where: { video_asset_id: result.asset_id, video_status: 'PROCESSING' },
        data:
          result.status === 'READY'
            ? {
                video_status: 'READY',
                video_source: 'AI',
                video_object_key: result.object_key,
                video_duration_ms: result.duration_ms,
                video_size_bytes: BigInt(result.size_bytes),
                video_mime_type: result.mime_type,
                video_error: null,
                updated_at: now,
              }
            : {
                video_status: 'FAILED',
                video_error: result.error,
                updated_at: now,
              },
      });

      return {
        applied: true,
        status: result.status,
        microContents: lessons.count,
      } as const;
    });
  }
}
