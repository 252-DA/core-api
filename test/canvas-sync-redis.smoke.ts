/** Run against a disposable Redis: CANVAS_SYNC_TEST_REDIS_URL=redis://... pnpm exec ts-node test/canvas-sync-redis.smoke.ts */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Job, Queue, QueueEvents, Worker } from 'bullmq';
import { CanvasSyncJobsService } from '../src/document/canvas-sync-jobs.service';
import { CanvasSyncProcessor } from '../src/document/canvas-sync.processor';

async function main() {
  const url = process.env.CANVAS_SYNC_TEST_REDIS_URL;
  if (!url)
    throw new Error(
      'Set CANVAS_SYNC_TEST_REDIS_URL to a disposable Redis instance.',
    );
  const parsed = new URL(url);
  const connection = {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    maxRetriesPerRequest: null,
  };
  const name = `canvas-sync-test-${randomUUID()}`;
  const queue = new Queue(name, { connection });
  const events = new QueueEvents(name, { connection });
  const workers: Worker[] = [];
  const prisma = {
    courses: { findMany: async () => [{ course_id: 'course-1' }] },
  };
  const config = {
    enabled: true,
    intervalMs: 900_000,
    launchCooldownMs: 120_000,
  };
  const jobs = new CanvasSyncJobsService(queue, prisma as never, config);
  const replica = new CanvasSyncJobsService(queue, prisma as never, config);
  let release!: () => void;
  let started!: () => void;
  const active = new Promise<void>((resolve) => {
    started = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let calls = 0;
  let fail = false;
  const sync = {
    syncCourse: async () => {
      calls++;
      started();
      await gate;
      if (fail) throw new Error('simulated Canvas outage');
      return { created: ['one.pdf'] };
    },
  };
  const processor = new CanvasSyncProcessor(sync as never, jobs);
  try {
    await events.waitUntilReady();
    await jobs.onModuleInit();
    await replica.onModuleInit();
    assert.equal(
      await queue.getJobSchedulersCount(),
      1,
      'replicas must upsert one scheduler',
    );
    await queue.removeJobScheduler('canvas-course-sweep');
    await queue.drain(true);

    await Promise.all([
      jobs.enqueue('course-1', { kind: 'user', userId: 'teacher' }, 'manual'),
      replica.triggerLaunch('course-1', 'canvas', 'instructor'),
      jobs.sweep(),
    ]);
    assert.equal(
      await queue.getWaitingCount(),
      1,
      'concurrent triggers must create one waiting job',
    );
    const firstJob = (await queue.getJob('canvas-sync-course-1'))!;
    const firstDone = firstJob.waitUntilFinished(events, 10_000);
    for (let i = 0; i < 2; i++) {
      workers.push(
        new Worker(name, (job) => processor.process(job), {
          connection,
          concurrency: 2,
        }),
      );
    }
    await active;
    await Promise.all([
      jobs.enqueue('course-1', { kind: 'system' }, 'manual'),
      replica.triggerLaunch('course-1', 'canvas', 'ta'),
      jobs.sweep(),
    ]);
    assert.equal(
      calls,
      1,
      'active course sync must not execute twice across workers',
    );
    assert.equal(
      await queue.getWaitingCount(),
      0,
      'active triggers must not queue duplicates',
    );
    release();
    await firstDone;
    assert.equal(await queue.getJob('canvas-sync-course-1'), undefined);
    assert.ok(
      await (await queue.client).get(queue.toKey('launch-cooldown:course-1')),
    );
    await replica.triggerLaunch('course-1', 'canvas', 'instructor');
    assert.equal(
      await queue.getJob('canvas-sync-course-1'),
      undefined,
      'cooldown applies across replicas',
    );

    // Pause processing while capturing the next job, avoiding races with removeOnComplete.
    await queue.pause();
    await jobs.enqueue('course-1', { kind: 'system' }, 'manual');
    const second = (await queue.getJob('canvas-sync-course-1'))!;
    const secondDone = second.waitUntilFinished(events, 10_000);
    await queue.resume();
    await secondDone;
    assert.equal(
      calls,
      2,
      'manual sync can reuse a completed ID during launch cooldown',
    );

    fail = true;
    await queue.pause();
    await jobs.enqueue('course-1', { kind: 'system' }, 'schedule');
    const failed = (await queue.getJob('canvas-sync-course-1'))!;
    const failedDone = failed.waitUntilFinished(events, 30_000).then(
      () => {
        throw new Error('expected failure');
      },
      (error: Error) => {
        assert.match(error.message, /simulated Canvas outage/);
      },
    );
    await queue.resume();
    await failedDone;
    assert.equal(calls, 5, 'failed jobs retry three times');
    assert.equal(
      await queue.getJob('canvas-sync-course-1'),
      undefined,
      'final failure must free the course ID',
    );

    fail = false;
    await queue.pause();
    await jobs.enqueue('course-1', { kind: 'system' }, 'schedule');
    const recovered = (await queue.getJob('canvas-sync-course-1')) as Job;
    const recoveredDone = recovered.waitUntilFinished(events, 10_000);
    await queue.resume();
    await recoveredDone;
    assert.equal(calls, 6, 'a later sweep can recover after final failure');
    console.log(
      'PASS: scheduler upsert, concurrent triggers, two workers, shared cooldown, retries, and job ID reuse.',
    );
  } finally {
    release();
    await Promise.all(workers.map((worker) => worker.close()));
    await events.close();
    await queue.obliterate({ force: true });
    await (await queue.client).del(queue.toKey('launch-cooldown:course-1'));
    await queue.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
