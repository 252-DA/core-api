import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { runBestEffort } from '../../common/utils/best-effort';
import { isWithinCodePoints } from '../../common/utils/text-length';
import { isIntIn, isPlainObject } from '../../common/utils/type-guards';
import { isUuid } from '../../common/utils/uuid';
import { PrismaService } from '../../infra/prisma/prisma.service';
import {
  InvalidWorkerResultError,
  type WorkerResultEnvelope,
} from '../../messaging/worker-results/worker-result-envelope';
import { WorkerResultHandler } from '../../messaging/worker-results/worker-result-handler';

export interface EnrichmentCard {
  card_id: string;
  primary_chunk_id: string;
  source_chunk_ids: string[];
  heading_path: string[];
  title: string;
  bullets: string[];
  key_insight: string;
  card_index: number;
}

export interface EnrichmentQuizItem {
  quiz_id: string;
  primary_chunk_id: string;
  source_chunk_ids: string[];
  question: string;
  choices: string[];
  correct_index: number;
  explanation: string;
}

/** contracts/integration-events/v1/enrichment-content-result.json */
export interface EnrichmentContentPayload {
  document_id: string;
  processing_generation: number;
  model_id: string | null;
  lesson_cards: EnrichmentCard[];
  quiz_items: EnrichmentQuizItem[];
}

export type EnrichmentContentOutcome =
  | {
      applied: true;
      cards: number;
      quizItems: number;
      /** Thẻ/câu mà chunk chính chưa gắn LO nào: bỏ, như đường cũ. */
      skippedCards: number;
      skippedQuizItems: number;
      retiredCards: number;
      retiredQuizItems: number;
    }
  | {
      applied: false;
      reason: 'document_missing' | 'stale_generation' | 'already_applied';
    };

const MAX_INT4 = 2_147_483_647;
const MAX_ITEMS = 5000;
const MAX_SOURCE_CHUNKS = 200;
const MAX_HEADINGS = 50;
const MAX_TITLE = 255; // lesson_cards.title VARCHAR(255)
const MAX_MODEL_ID = 200;
const CARD_KEYS = [
  'card_id',
  'primary_chunk_id',
  'source_chunk_ids',
  'heading_path',
  'title',
  'bullets',
  'key_insight',
  'card_index',
];
const QUIZ_KEYS = [
  'quiz_id',
  'primary_chunk_id',
  'source_chunk_ids',
  'question',
  'choices',
  'correct_index',
  'explanation',
];
// Bản nháp được thay; câu/thẻ đã duyệt hoặc đã xuất bản thì giữ.
const DRAFT_STATUSES = ['GENERATED_DRAFT', 'REVIEWING', 'CHANGES_REQUESTED'];

function isText(
  value: unknown,
  max = Number.MAX_SAFE_INTEGER,
): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    isWithinCodePoints(value, max)
  );
}

function checkChunks(
  item: Record<string, unknown>,
  where: string,
  problems: string[],
) {
  if (!isUuid(item.primary_chunk_id))
    problems.push(`${where}.primary_chunk_id must be a UUID`);
  const ids = item.source_chunk_ids;
  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.length > MAX_SOURCE_CHUNKS ||
    !ids.every(isUuid)
  ) {
    problems.push(
      `${where}.source_chunk_ids must be 1..${MAX_SOURCE_CHUNKS} UUIDs`,
    );
  }
}

function checkKeys(
  item: Record<string, unknown>,
  keys: string[],
  where: string,
  problems: string[],
) {
  const extra = Object.keys(item).filter((key) => !keys.includes(key));
  if (extra.length)
    problems.push(`${where}: unexpected fields ${extra.join(', ')}`);
}

function checkCard(card: unknown, i: number, problems: string[]) {
  const where = `lesson_cards[${i}]`;
  if (!isPlainObject(card)) {
    problems.push(`${where} must be an object`);
    return;
  }
  checkKeys(card, CARD_KEYS, where, problems);
  if (!isUuid(card.card_id)) problems.push(`${where}.card_id must be a UUID`);
  checkChunks(card, where, problems);
  const headings = card.heading_path;
  if (
    !Array.isArray(headings) ||
    headings.length > MAX_HEADINGS ||
    !headings.every((h) => typeof h === 'string')
  ) {
    problems.push(`${where}.heading_path must be an array of strings`);
  }
  if (!isText(card.title, MAX_TITLE))
    problems.push(`${where}.title must be 1..${MAX_TITLE} chars`);
  const bullets = card.bullets;
  if (
    !Array.isArray(bullets) ||
    bullets.length === 0 ||
    bullets.length > 10 ||
    !bullets.every((b) => isText(b))
  ) {
    problems.push(`${where}.bullets must be 1..10 non-empty strings`);
  }
  if (!isText(card.key_insight))
    problems.push(`${where}.key_insight must be a non-empty string`);
  if (!isIntIn(card.card_index, 0, MAX_INT4))
    problems.push(`${where}.card_index must be an integer >= 0`);
}

function checkQuizItem(item: unknown, i: number, problems: string[]) {
  const where = `quiz_items[${i}]`;
  if (!isPlainObject(item)) {
    problems.push(`${where} must be an object`);
    return;
  }
  checkKeys(item, QUIZ_KEYS, where, problems);
  if (!isUuid(item.quiz_id)) problems.push(`${where}.quiz_id must be a UUID`);
  checkChunks(item, where, problems);
  if (!isText(item.question))
    problems.push(`${where}.question must be a non-empty string`);
  const choices = item.choices;
  const choicesOk =
    Array.isArray(choices) &&
    choices.length >= 2 &&
    choices.length <= 10 &&
    choices.every((c) => isText(c));
  if (!choicesOk)
    problems.push(`${where}.choices must be 2..10 non-empty strings`);
  // correct_answer của MCQ_SINGLE là chuỗi lựa chọn đúng (CHECK hình dạng trong
  // migration 20261107120000): chỉ số ngoài khoảng là kết quả hỏng, không lưu.
  if (
    !isIntIn(item.correct_index, 0, 9) ||
    (choicesOk && item.correct_index >= (choices as unknown[]).length)
  ) {
    problems.push(`${where}.correct_index must point at one of the choices`);
  }
  if (!isText(item.explanation))
    problems.push(`${where}.explanation must be a non-empty string`);
}

function checkUnique(values: string[], label: string, problems: string[]) {
  if (new Set(values).size !== values.length)
    problems.push(`${label} must be unique`);
}

/**
 * Kiểm payload đúng schema; sai thì ném InvalidWorkerResultError (không retry)
 * liệt kê mọi chỗ sai. Kiểm UUID/độ dài ở đây vì để Postgres từ chối thì thành
 * lỗi DB và bị retry vô ích.
 */
export function parseEnrichmentContentPayload(
  payload: Record<string, unknown>,
  resultId: string,
): EnrichmentContentPayload {
  const problems: string[] = [];
  checkKeys(
    payload,
    [
      'document_id',
      'processing_generation',
      'model_id',
      'lesson_cards',
      'quiz_items',
    ],
    'payload',
    problems,
  );
  if (!isUuid(payload.document_id)) problems.push('document_id must be a UUID');
  if (!isIntIn(payload.processing_generation, 0, MAX_INT4)) {
    problems.push('processing_generation must be an integer >= 0');
  }
  if (
    !('model_id' in payload) ||
    (payload.model_id !== null &&
      (typeof payload.model_id !== 'string' ||
        !isWithinCodePoints(payload.model_id, MAX_MODEL_ID)))
  ) {
    problems.push(
      `model_id must be a string of at most ${MAX_MODEL_ID} chars or null`,
    );
  }
  const { lesson_cards: cards, quiz_items: items } = payload;
  if (!Array.isArray(cards) || cards.length > MAX_ITEMS) {
    problems.push(`lesson_cards must be an array of at most ${MAX_ITEMS}`);
  } else {
    cards.forEach((card, i) => checkCard(card, i, problems));
    checkUnique(
      cards.map((c) => (c as { card_id?: string })?.card_id ?? ''),
      'card_id',
      problems,
    );
  }
  if (!Array.isArray(items) || items.length > MAX_ITEMS) {
    problems.push(`quiz_items must be an array of at most ${MAX_ITEMS}`);
  } else {
    items.forEach((item, i) => checkQuizItem(item, i, problems));
    checkUnique(
      items.map((q) => (q as { quiz_id?: string })?.quiz_id ?? ''),
      'quiz_id',
      problems,
    );
  }
  if (problems.length) {
    throw new InvalidWorkerResultError(
      `invalid ENRICHMENT_CONTENT_RESULT ${resultId}: ${problems.slice(0, 20).join('; ')}`,
    );
  }
  return payload as unknown as EnrichmentContentPayload;
}

/**
 * Áp dụng ENRICHMENT_CONTENT_RESULT: học liệu nháp sinh tự động từ một tài liệu
 * → lessons, lesson_cards, quiz_items. Trước đây worker ghi thẳng ba bảng này
 * (persist_enrichment_batch); nay worker chỉ ghi concepts/chunk_concepts + outbox
 * và gửi học liệu về đây (docs/ke-hoach-ranh-gioi-du-lieu.md). Tính năng lesson
 * card đang tạm gác: chỉ chuyển chỗ ghi, giữ đúng ngữ nghĩa cũ:
 *   - "thay theo tài liệu": soft-delete mọi thẻ/câu nháp có source_chunk_ids
 *     chạm chunk của tài liệu, rồi thêm bộ mới (rỗng = chỉ xoá nháp);
 *   - mỗi thẻ/câu vào lesson của LO có confidence cao nhất của chunk chính, tạo
 *     lesson DRAFT nếu chưa có; chunk chưa gắn LO thì bỏ thẻ/câu đó.
 *
 * Idempotent và chống kết quả cũ, trong một transaction có khoá dòng tài liệu:
 * chỉ áp dụng khi processing_generation = documents.processing_generation (lượt
 * hiện tại) và lượt đó chưa được áp dụng (documents.enrichment_generation). Gửi
 * lại cùng kết quả hay kết quả của lượt cũ đến trễ đều không đụng gì.
 */
@Injectable()
@WorkerResultHandler('ENRICHMENT_CONTENT_RESULT')
export class EnrichmentContentResultHandler implements WorkerResultHandler<
  Record<string, unknown>
> {
  private readonly logger = new Logger(EnrichmentContentResultHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(
    envelope: WorkerResultEnvelope<Record<string, unknown>>,
  ): Promise<EnrichmentContentOutcome> {
    const result = parseEnrichmentContentPayload(
      envelope.payload,
      envelope.result_id,
    );
    // Tài liệu lớn có hàng nghìn câu: vài câu lệnh gộp, nhưng cho rộng thời gian
    // khi DB ở xa (mặc định 5s của Prisma).
    const outcome = await this.prisma.$transaction(
      (tx) => this.apply(tx, result),
      {
        timeout: 30_000,
      },
    );
    if (outcome.applied) {
      if (outcome.skippedCards || outcome.skippedQuizItems) {
        this.logger.warn(
          `${envelope.result_id}: bỏ ${outcome.skippedCards} thẻ, ${outcome.skippedQuizItems} câu vì chunk chưa gắn LO`,
        );
      }
    } else {
      this.logger.log(
        `Bỏ qua ${envelope.result_id} (tài liệu ${result.document_id}): ${outcome.reason}`,
      );
    }
    return outcome;
  }

  /**
   * Học liệu nháp không bao giờ lưu được (payload sai, hay lỗi DB hết lượt thử).
   * Chỉ ghi log, KHÔNG đổi trạng thái tài liệu — cố ý:
   *   - không có dòng nào kẹt ở trạng thái chờ: tài liệu đi hết ENRICHING →
   *     INDEXED/GENERATED_DRAFT bằng các báo cáo DOCUMENT_PROCESSING_RESULT riêng
   *     của worker, không phụ thuộc kết quả này; enrichment_generation chỉ ghi khi
   *     áp dụng nên vẫn NULL/lượt cũ và lần enrichment sau (lượt mới) ghi lại được;
   *   - lùi tài liệu về INDEXED không bền: báo cáo GENERATED_DRAFT cùng lượt có thể
   *     tới sau và đặt lại (processing_seq không cho biết kết quả này nằm ở đâu
   *     trong chuỗi), và GENERATED_DRAFT còn mang nghĩa "đã chiếu concept graph".
   * Hậu quả duy nhất là tài liệu hiện GENERATED_DRAFT mà chưa có thẻ/câu nháp (tính
   * năng thẻ bài đang gác); log này là dấu vết để biết vì sao.
   */
  async onFinalFailure(
    envelope: WorkerResultEnvelope<Record<string, unknown>>,
    error: Error,
  ) {
    await runBestEffort(
      this.logger,
      `Không ghi được log lỗi của ${envelope.result_id}`,
      () => {
        const payload: unknown = envelope.payload;
        const documentId = isPlainObject(payload)
          ? payload.document_id
          : undefined;
        const generation = isPlainObject(payload)
          ? payload.processing_generation
          : undefined;
        this.logger.warn(
          `Học liệu nháp ${envelope.result_id} thất bại vĩnh viễn (${error.message}): ` +
            `tài liệu ${isUuid(documentId) ? documentId : '(không rõ)'} ` +
            `lượt ${typeof generation === 'number' ? generation : '?'} không có thẻ/câu nháp mới; ` +
            'trạng thái tài liệu giữ nguyên',
        );
        return Promise.resolve();
      },
    );
  }

  private async apply(
    tx: Prisma.TransactionClient,
    result: EnrichmentContentPayload,
  ): Promise<EnrichmentContentOutcome> {
    const documentId = result.document_id;
    const [doc] = await tx.$queryRaw<
      Array<{
        processing_generation: number;
        enrichment_generation: number | null;
        deleted_at: Date | null;
      }>
    >`
      SELECT processing_generation, enrichment_generation, deleted_at
        FROM documents
       WHERE document_id = ${documentId}::uuid
       FOR UPDATE`;
    if (!doc || doc.deleted_at)
      return { applied: false, reason: 'document_missing' };
    if (doc.processing_generation !== result.processing_generation) {
      return { applied: false, reason: 'stale_generation' };
    }
    if (doc.enrichment_generation === result.processing_generation) {
      return { applied: false, reason: 'already_applied' };
    }

    const retiredCards = await tx.$executeRaw`
      UPDATE lesson_cards
         SET deleted_at = NOW()
       WHERE deleted_at IS NULL
         AND status = ANY(${DRAFT_STATUSES}::text[])
         AND EXISTS (
           SELECT 1 FROM chunks c
            WHERE c.document_id = ${documentId}::uuid
              AND c.chunk_id = ANY(lesson_cards.source_chunk_ids)
         )`;
    const retiredQuizItems = await tx.$executeRaw`
      UPDATE quiz_items
         SET deleted_at = NOW()
       WHERE deleted_at IS NULL
         AND status = ANY(${DRAFT_STATUSES}::text[])
         AND EXISTS (
           SELECT 1 FROM chunks c
            WHERE c.document_id = ${documentId}::uuid
              AND c.chunk_id = ANY(quiz_items.source_chunk_ids)
         )`;

    const cards = result.lesson_cards.length
      ? await this.insertCards(tx, result)
      : 0;
    const quizItems = result.quiz_items.length
      ? await this.insertQuizItems(tx, result)
      : 0;

    await tx.documents.update({
      where: { document_id: documentId },
      data: { enrichment_generation: result.processing_generation },
    });

    return {
      applied: true,
      cards,
      quizItems,
      skippedCards: result.lesson_cards.length - cards,
      skippedQuizItems: result.quiz_items.length - quizItems,
      retiredCards,
      retiredQuizItems,
    };
  }

  /** Một câu lệnh cho cả bộ thẻ: LO tốt nhất của chunk chính → lesson → thẻ. */
  private insertCards(
    tx: Prisma.TransactionClient,
    result: EnrichmentContentPayload,
  ): Promise<number> {
    const rows = JSON.stringify(
      result.lesson_cards.map((card) => ({
        card_id: card.card_id,
        primary_chunk_id: card.primary_chunk_id,
        source_chunk_ids: card.source_chunk_ids,
        title: card.title,
        // Cùng dạng content đường cũ ghi; màn hình duyệt đọc các khoá này.
        content: {
          key_insight: card.key_insight,
          bullets: card.bullets,
          heading_path: card.heading_path,
          model_id: result.model_id,
          card_index: card.card_index,
        },
      })),
    );
    return tx.$executeRaw`
      WITH input AS (
        SELECT *
          FROM jsonb_to_recordset(${rows}::jsonb) AS x(
            card_id uuid, primary_chunk_id uuid, source_chunk_ids uuid[],
            title text, content jsonb)
      ),
      ctx AS (
        SELECT i.*, best.course_id, best.lo_id, best.statement_vi
          FROM input i
          JOIN LATERAL (
            SELECT c.course_id, clm.lo_id, lo.statement_vi
              FROM chunks c
              JOIN chunk_lo_mappings clm ON clm.chunk_id = c.chunk_id
              JOIN learning_outcomes lo ON lo.lo_id = clm.lo_id
             WHERE c.chunk_id = i.primary_chunk_id
               AND c.deleted_at IS NULL
             ORDER BY clm.confidence DESC
             LIMIT 1
          ) best ON TRUE
      ),
      lesson_rows AS (
        INSERT INTO lessons (course_id, lo_id, title, status)
        SELECT DISTINCT ON (course_id, lo_id)
               course_id, lo_id, LEFT(COALESCE(statement_vi, 'Generated lesson'), 255), 'DRAFT'
          FROM ctx
        ON CONFLICT (course_id, lo_id) DO UPDATE SET updated_at = NOW()
        RETURNING lesson_id, course_id, lo_id
      )
      INSERT INTO lesson_cards (
        card_id, lesson_id, course_id, lo_id, title, content, source_chunk_ids, status, deleted_at
      )
      SELECT ctx.card_id, l.lesson_id, ctx.course_id, ctx.lo_id, ctx.title, ctx.content,
             ctx.source_chunk_ids, 'GENERATED_DRAFT', NULL
        FROM ctx
        JOIN lesson_rows l ON l.course_id = ctx.course_id AND l.lo_id = ctx.lo_id
      ON CONFLICT (card_id) DO UPDATE SET
        lesson_id = EXCLUDED.lesson_id,
        course_id = EXCLUDED.course_id,
        lo_id = EXCLUDED.lo_id,
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        source_chunk_ids = EXCLUDED.source_chunk_ids,
        status = 'GENERATED_DRAFT',
        updated_at = NOW(),
        deleted_at = NULL`;
  }

  /** Câu MCQ_SINGLE: options = các lựa chọn, correct_answer = chuỗi lựa chọn đúng. */
  private insertQuizItems(
    tx: Prisma.TransactionClient,
    result: EnrichmentContentPayload,
  ): Promise<number> {
    const rows = JSON.stringify(
      result.quiz_items.map((item) => ({
        quiz_id: item.quiz_id,
        primary_chunk_id: item.primary_chunk_id,
        source_chunk_ids: item.source_chunk_ids,
        question: item.question,
        options: item.choices,
        correct_answer: item.choices[item.correct_index],
        explanation: item.explanation,
      })),
    );
    return tx.$executeRaw`
      WITH input AS (
        SELECT *
          FROM jsonb_to_recordset(${rows}::jsonb) AS x(
            quiz_id uuid, primary_chunk_id uuid, source_chunk_ids uuid[],
            question text, options jsonb, correct_answer jsonb, explanation text)
      ),
      ctx AS (
        SELECT i.*, best.course_id, best.lo_id, best.statement_vi
          FROM input i
          JOIN LATERAL (
            SELECT c.course_id, clm.lo_id, lo.statement_vi
              FROM chunks c
              JOIN chunk_lo_mappings clm ON clm.chunk_id = c.chunk_id
              JOIN learning_outcomes lo ON lo.lo_id = clm.lo_id
             WHERE c.chunk_id = i.primary_chunk_id
               AND c.deleted_at IS NULL
             ORDER BY clm.confidence DESC
             LIMIT 1
          ) best ON TRUE
      ),
      lesson_rows AS (
        INSERT INTO lessons (course_id, lo_id, title, status)
        SELECT DISTINCT ON (course_id, lo_id)
               course_id, lo_id, LEFT(COALESCE(statement_vi, 'Generated lesson'), 255), 'DRAFT'
          FROM ctx
        ON CONFLICT (course_id, lo_id) DO UPDATE SET updated_at = NOW()
        RETURNING lesson_id, course_id, lo_id
      )
      INSERT INTO quiz_items (
        quiz_id, lesson_id, course_id, lo_id, type, question, options, correct_answer,
        explanation, source_chunk_ids, status, deleted_at
      )
      SELECT ctx.quiz_id, l.lesson_id, ctx.course_id, ctx.lo_id, 'MCQ_SINGLE', ctx.question,
             ctx.options, ctx.correct_answer, ctx.explanation, ctx.source_chunk_ids,
             'GENERATED_DRAFT', NULL
        FROM ctx
        JOIN lesson_rows l ON l.course_id = ctx.course_id AND l.lo_id = ctx.lo_id
      ON CONFLICT (quiz_id) DO UPDATE SET
        lesson_id = EXCLUDED.lesson_id,
        course_id = EXCLUDED.course_id,
        lo_id = EXCLUDED.lo_id,
        question = EXCLUDED.question,
        options = EXCLUDED.options,
        correct_answer = EXCLUDED.correct_answer,
        explanation = EXCLUDED.explanation,
        source_chunk_ids = EXCLUDED.source_chunk_ids,
        status = 'GENERATED_DRAFT',
        updated_at = NOW(),
        deleted_at = NULL`;
  }
}
