import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import type { BffClaims } from '../../auth/bff-claims';
import type { WorkerResultEnvelope } from '../../messaging/worker-results/worker-result-envelope';
import { MicroContentService } from './micro-content.service';
import { MicroContentVideoResultHandler } from './micro-content-video-result.handler';

/**
 * Chạy thật trên PostgreSQL đã áp đủ migration: requestRender (core-api phát
 * lệnh) → kết quả worker → handler, kèm CHECK constraint thật và khoá dòng thật.
 * Bỏ qua khi không đặt VIDEO_RESULT_IT_DATABASE_URL.
 *
 *   VIDEO_RESULT_IT_DATABASE_URL=postgresql://postgres:scratch@localhost:55432/chunking_m \
 *     npx jest src/micro-content/micro-content-video-result.handler.integration.spec.ts
 *
 * Test tạo khoá học/người dùng riêng và xoá chúng khi xong; chỉ trỏ vào DB tạm.
 */
const url = process.env.VIDEO_RESULT_IT_DATABASE_URL;
const describeDb = url ? describe : describe.skip;

describeDb('MicroContentVideoResultHandler on PostgreSQL', () => {
  let prisma: PrismaClient;
  let handler: MicroContentVideoResultHandler;
  let microContents: MicroContentService;
  let claims: BffClaims;
  let courseId: string;
  let userId: string;

  beforeAll(async () => {
    prisma = new PrismaClient({ adapter: new PrismaPg(url!) });
    await prisma.$connect();
    handler = new MicroContentVideoResultHandler(prisma as never);
    const authz = {
      assertCourseAccess: jest.fn().mockResolvedValue(undefined),
    };
    microContents = new MicroContentService(prisma as never, authz as never);

    const user = await prisma.lms_user_mappings.create({
      data: {
        lms_sub: `it-video-${randomUUID()}`,
        display_name: 'IT video',
        role: 'instructor',
      },
    });
    userId = user.internal_user_id;
    const course = await prisma.courses.create({
      data: { code: `IT-VIDEO-${randomUUID().slice(0, 8)}`, name: 'IT video' },
    });
    courseId = course.course_id;
    claims = {
      sub: userId,
      roles: ['instructor'],
      scope: 'course',
      jti: 'it',
      iat: 0,
      exp: 1,
    };
  });

  afterAll(async () => {
    if (prisma && courseId) {
      await prisma.outbox_events.deleteMany({
        where: {
          event_type: 'MICRO_CONTENT_RENDER_REQUESTED',
          payload: { path: ['course_id'], equals: courseId },
        },
      });
      await prisma.micro_contents.deleteMany({
        where: { course_id: courseId },
      });
      await prisma.video_assets.deleteMany({ where: { owner_id: userId } });
      await prisma.courses.delete({ where: { course_id: courseId } });
      await prisma.lms_user_mappings.delete({
        where: { internal_user_id: userId },
      });
    }
    await prisma?.$disconnect();
  });

  async function lesson() {
    const mc = await prisma.micro_contents.create({
      data: {
        course_id: courseId,
        title: 'Đệ quy',
        created_by: userId,
        ai_script: { scenes: [{ title: 'Giới thiệu', narration: 'Chào' }] },
      },
    });
    return mc.micro_content_id;
  }

  /** requestRender thật; trả về payload lệnh nó vừa ghi vào outbox. */
  async function render(microContentId: string) {
    await microContents.requestRender(claims, { microContentId });
    const [event] = await prisma.outbox_events.findMany({
      where: {
        event_type: 'MICRO_CONTENT_RENDER_REQUESTED',
        aggregate_id: microContentId,
      },
      orderBy: { occurred_at: 'desc' },
      take: 1,
    });
    return {
      eventId: event.event_id,
      payload: event.payload as {
        micro_content_id: string;
        asset_id: string;
        render_id: string;
        course_id: string;
      },
    };
  }

  function ready(
    cmd: Awaited<ReturnType<typeof render>>,
    sizeBytes = 2 ** 40,
  ): WorkerResultEnvelope<Record<string, unknown>> {
    const p = cmd.payload;
    return {
      result_id: `MICRO_CONTENT_VIDEO_RESULT.${p.render_id}.ready`,
      kind: 'MICRO_CONTENT_VIDEO_RESULT',
      source_event_id: cmd.eventId,
      occurred_at: new Date().toISOString(),
      payload: {
        micro_content_id: p.micro_content_id,
        asset_id: p.asset_id,
        render_id: p.render_id,
        status: 'READY',
        object_key: `micro-content/${p.course_id}/${p.micro_content_id}/ai-${p.render_id}.mp4`,
        duration_ms: 7700,
        size_bytes: sizeBytes,
        mime_type: 'video/mp4',
      },
    };
  }

  function failed(
    cmd: Awaited<ReturnType<typeof render>>,
  ): WorkerResultEnvelope<Record<string, unknown>> {
    const p = cmd.payload;
    return {
      result_id: `MICRO_CONTENT_VIDEO_RESULT.${p.render_id}.failed`,
      kind: 'MICRO_CONTENT_VIDEO_RESULT',
      source_event_id: cmd.eventId,
      occurred_at: new Date().toISOString(),
      payload: {
        micro_content_id: p.micro_content_id,
        asset_id: p.asset_id,
        render_id: p.render_id,
        status: 'FAILED',
        error: 'TTS failure',
      },
    };
  }

  const mcRow = (id: string) =>
    prisma.micro_contents.findUniqueOrThrow({
      where: { micro_content_id: id },
    });
  const assetRow = (id: string) =>
    prisma.video_assets.findUniqueOrThrow({ where: { asset_id: id } });

  it('requestRender carries render_id in the command and on the asset; READY lands on both tables', async () => {
    const id = await lesson();
    const cmd = await render(id);

    expect(cmd.payload.render_id).toMatch(/^[0-9a-f-]{36}$/);
    expect((await assetRow(cmd.payload.asset_id)).ai_render_id).toBe(
      cmd.payload.render_id,
    );

    const out = await handler.handle(ready(cmd));
    expect(out).toEqual({ applied: true, status: 'READY', microContents: 1 });

    const mc = await mcRow(id);
    expect(mc).toMatchObject({
      video_status: 'READY',
      video_source: 'AI',
      video_object_key: ready(cmd).payload.object_key,
      video_duration_ms: 7700,
      video_size_bytes: BigInt(2 ** 40),
      video_mime_type: 'video/mp4',
      video_error: null,
    });
    const asset = await assetRow(cmd.payload.asset_id);
    expect(asset).toMatchObject({
      status: 'READY',
      object_key: ready(cmd).payload.object_key,
      duration_ms: 7700,
      size_bytes: BigInt(2 ** 40),
      error_message: null,
    });

    // Gửi lại y hệt: không đổi gì (updated_at giữ nguyên).
    await expect(handler.handle(ready(cmd))).resolves.toEqual({
      applied: false,
      reason: 'already_applied',
    });
    expect((await mcRow(id)).updated_at).toEqual(mc.updated_at);
    // FAILED muộn của cùng lần render không đè READY.
    await handler.handle(failed(cmd));
    expect((await mcRow(id)).video_status).toBe('READY');
  });

  it('requestRender sends the canonical micro_content_id even when the client spelled the uuid differently', async () => {
    const id = await lesson();
    // Postgres nhận uuid viết hoa và bỏ gạch, nên request vẫn tìm thấy bài.
    const sloppy = id.toUpperCase().replace(/-/g, '');
    expect(sloppy).not.toBe(id);

    await microContents.requestRender(claims, { microContentId: sloppy });

    const [event] = await prisma.outbox_events.findMany({
      where: { event_type: 'MICRO_CONTENT_RENDER_REQUESTED', aggregate_id: id },
    });
    expect(event.aggregate_id).toBe(id);
    expect((event.payload as { micro_content_id: string }).micro_content_id).toBe(id);
    expect((await mcRow(id)).video_status).toBe('PROCESSING');
  });

  it('result of an earlier render never overwrites a later one, in either order', async () => {
    const id = await lesson();
    const first = await render(id);
    const second = await render(id);
    // Render lại dùng lại asset AI của bài.
    expect(second.payload.asset_id).toBe(first.payload.asset_id);

    // Lần đầu xong muộn khi lần sau còn chạy: bỏ qua, bài vẫn chờ.
    await expect(handler.handle(ready(first))).resolves.toEqual({
      applied: false,
      reason: 'superseded',
    });
    expect((await mcRow(id)).video_status).toBe('PROCESSING');

    await handler.handle(ready(second));
    // Lần đầu lỗi ở lần thử cuối, sau khi lần sau đã xong: vẫn bỏ qua.
    await handler.handle(failed(first));

    const mc = await mcRow(id);
    expect(mc.video_status).toBe('READY');
    expect(mc.video_object_key).toBe(ready(second).payload.object_key);
  });

  it('FAILED marks the asset and the lesson with the error', async () => {
    const id = await lesson();
    const cmd = await render(id);

    await handler.handle(failed(cmd));

    expect(await mcRow(id)).toMatchObject({
      video_status: 'FAILED',
      video_error: 'TTS failure',
    });
    expect(await assetRow(cmd.payload.asset_id)).toMatchObject({
      status: 'FAILED',
      error_message: 'TTS failure',
    });
  });

  it('onFinalFailure: a result that can never be applied fails the asset and its lesson so render can be retried', async () => {
    const id = await lesson();
    const cmd = await render(id);
    // size_bytes không phải số nguyên an toàn: handle() từ chối, job hết đường.
    const bad = ready(cmd, 1.5);
    const failure = await handler.handle(bad).catch((e: Error) => e);
    expect(failure).toBeInstanceOf(Error);
    expect((await mcRow(id)).video_status).toBe('PROCESSING');

    await handler.onFinalFailure(bad, failure as Error);

    expect(await mcRow(id)).toMatchObject({
      video_status: 'FAILED',
      video_error: expect.stringContaining('Không lưu được kết quả render video') as string,
    });
    expect(await assetRow(cmd.payload.asset_id)).toMatchObject({ status: 'FAILED' });
    // Giảng viên bấm render lại: asset về PROCESSING với render_id mới.
    const again = await render(id);
    expect(again.payload.render_id).not.toBe(cmd.payload.render_id);
    expect((await mcRow(id)).video_status).toBe('PROCESSING');
    await handler.handle(ready(again));
    expect((await mcRow(id)).video_status).toBe('READY');
  });

  it('onFinalFailure of an earlier render never fails a later render or a finished asset', async () => {
    const id = await lesson();
    const first = await render(id);
    const second = await render(id);

    await handler.onFinalFailure(ready(first), new Error('x'));
    expect((await mcRow(id)).video_status).toBe('PROCESSING');
    expect((await assetRow(first.payload.asset_id)).status).toBe('PROCESSING');

    await handler.handle(ready(second));
    await handler.onFinalFailure(ready(second), new Error('late failure'));
    expect((await mcRow(id)).video_status).toBe('READY');
    expect((await assetRow(second.payload.asset_id)).status).toBe('READY');
  });

  it('lesson that moved to another video is left alone; the render still completes its asset', async () => {
    const id = await lesson();
    const cmd = await render(id);
    const upload = await prisma.video_assets.create({
      data: {
        title: 'upload',
        owner_id: userId,
        course_id: courseId,
        source_type: 'USER_UPLOAD',
        status: 'UPLOADING',
      },
    });
    await prisma.micro_contents.update({
      where: { micro_content_id: id },
      data: {
        video_asset_id: upload.asset_id,
        video_source: 'UPLOAD',
        video_status: 'UPLOADING',
      },
    });

    await expect(handler.handle(ready(cmd))).resolves.toEqual({
      applied: true,
      status: 'READY',
      microContents: 0,
    });
    expect(await mcRow(id)).toMatchObject({
      video_status: 'UPLOADING',
      video_asset_id: upload.asset_id,
      video_source: 'UPLOAD',
    });
    expect((await assetRow(cmd.payload.asset_id)).status).toBe('READY');
  });

  it('another lesson attached to the rendering asset gets the video too', async () => {
    const id = await lesson();
    const other = await lesson();
    const cmd = await render(id);
    await prisma.micro_contents.update({
      where: { micro_content_id: other },
      data: {
        video_asset_id: cmd.payload.asset_id,
        video_source: 'AI',
        video_status: 'PROCESSING',
      },
    });

    await expect(handler.handle(ready(cmd))).resolves.toMatchObject({
      microContents: 2,
    });
    expect((await mcRow(other)).video_status).toBe('READY');
  });

  it('two core-api instances applying the same result: exactly one applies', async () => {
    const id = await lesson();
    const cmd = await render(id);
    const secondClient = new PrismaClient({ adapter: new PrismaPg(url!) });
    const other = new MicroContentVideoResultHandler(secondClient as never);

    try {
      const outcomes = await Promise.all([
        handler.handle(ready(cmd)),
        other.handle(ready(cmd)),
      ]);
      expect(outcomes.filter((o) => o.applied)).toHaveLength(1);
    } finally {
      await secondClient.$disconnect();
    }
    expect((await mcRow(id)).video_status).toBe('READY');
  });
});
