import { plan, type PlannerInput, type PlannerLo } from './planner';
import {
  applyReview,
  enterReview,
  isDue,
  localDayStart,
} from './review-schedule';

function lo(loId: string, over: Partial<PlannerLo> = {}): PlannerLo {
  return {
    loId,
    mastered: false,
    episodeObservations: 0,
    wrongSinceSource: 0,
    sourceViews: 0,
    paused: false,
    awaitingGrade: false,
    hasNewItem: true,
    hasReviewItem: true,
    hasSource: true,
    ...over,
  };
}

function input(
  scope: PlannerLo[],
  over: Partial<PlannerInput> = {},
): PlannerInput {
  return {
    scope,
    currentLoId: null,
    dueLoIds: [],
    today: { answered: 0, reviewsAnswered: 0 },
    ...over,
  };
}

describe('planner', () => {
  it('R0: hết hạn mức ngày thì chỉ còn nghỉ, kể cả khi có LO đến hạn ôn', () => {
    const d = plan(
      input([lo('a')], {
        dueLoIds: ['a'],
        today: { answered: 30, reviewsAnswered: 0 },
      }),
    );
    expect(d).toMatchObject({
      action: 'A0',
      rule: 'R0',
      reason: 'daily_limit',
      alternatives: [],
    });
  });

  it('R1: ôn LO đến hạn trước; LO đến hạn ngoài phạm vi bị bỏ qua', () => {
    const scope = [lo('a'), lo('b', { mastered: true })];
    expect(plan(input(scope, { dueLoIds: ['x', 'b'] }))).toMatchObject({
      action: 'A4',
      loId: 'b',
      rule: 'R1',
    });
    // Hết hạn mức ôn trong ngày thì tiếp tục luyện.
    const d = plan(
      input(scope, {
        dueLoIds: ['b'],
        today: { answered: 5, reviewsAnswered: 5 },
      }),
    );
    expect(d).toMatchObject({ action: 'A1', loId: 'a', rule: 'R4' });
  });

  it('R1: LO đến hạn không còn câu ôn thì ghi thiếu tài nguyên rồi xét tiếp', () => {
    const scope = [lo('a'), lo('b', { mastered: true, hasReviewItem: false })];
    const d = plan(input(scope, { dueLoIds: ['b'] }));
    expect(d).toMatchObject({ action: 'A1', loId: 'a' });
    expect(d.issues).toEqual([{ loId: 'b', issue: 'missing_review_item' }]);
  });

  it('R2: mười quan sát trong đợt mà chưa đạt thì báo giảng viên và gợi ý LO khác', () => {
    const d = plan(
      input([lo('a', { episodeObservations: 10 }), lo('b')], {
        currentLoId: 'a',
      }),
    );
    expect(d).toMatchObject({
      action: 'A6',
      loId: 'a',
      rule: 'R2',
      reason: 'stuck',
    });
    expect(d.alternatives).toEqual([{ action: 'A5', loId: 'b' }]);
  });

  it('R2: đã xem nguồn hai lần mà vẫn sai hai câu liên tiếp', () => {
    const d = plan(
      input([lo('a', { sourceViews: 2, wrongSinceSource: 2 })], {
        currentLoId: 'a',
      }),
    );
    expect(d).toMatchObject({ action: 'A6', rule: 'R2' });
  });

  it('R3: sai hai câu liên tiếp thì xem lại nguồn; thiếu nguồn thì luyện tiếp và ghi thiếu', () => {
    expect(
      plan(input([lo('a', { wrongSinceSource: 2 })], { currentLoId: 'a' })),
    ).toMatchObject({
      action: 'A3',
      rule: 'R3',
      evidence: { wrongSinceSource: 2 },
    });
    const d = plan(
      input([lo('a', { wrongSinceSource: 2, hasSource: false })], {
        currentLoId: 'a',
      }),
    );
    expect(d).toMatchObject({ action: 'A1', rule: 'R4' });
    expect(d.issues).toEqual([{ loId: 'a', issue: 'missing_source' }]);
  });

  it('R4: hết câu vì tự luận đang chờ chấm thì chờ; hết câu thật thì báo thiếu câu', () => {
    expect(
      plan(
        input([lo('a', { hasNewItem: false, awaitingGrade: true })], {
          currentLoId: 'a',
        }),
      ),
    ).toMatchObject({ action: 'WAIT', reason: 'awaiting_grade' });
    const d = plan(
      input([lo('a', { hasNewItem: false })], { currentLoId: 'a' }),
    );
    expect(d).toMatchObject({ action: 'A6', reason: 'missing_items' });
    expect(d.issues).toEqual([{ loId: 'a', issue: 'missing_items' }]);
  });

  it('R6: LO vừa đạt thì chuyển sang LO chưa đạt kế tiếp; hết LO thì kết thúc', () => {
    const scope = [lo('a', { mastered: true }), lo('b'), lo('c')];
    const d = plan(input(scope, { currentLoId: 'a' }));
    expect(d).toMatchObject({ action: 'A5', loId: 'b', rule: 'R6' });
    expect(d.alternatives).toEqual([{ action: 'A5', loId: 'c' }]);
    expect(
      plan(input([lo('a', { mastered: true })], { currentLoId: 'a' })),
    ).toMatchObject({
      action: 'A0',
      reason: 'all_mastered',
    });
  });

  it('bỏ qua LO đã tạm dừng khi chọn LO đang xử lý', () => {
    const d = plan(
      input([lo('a', { paused: true }), lo('b')], { currentLoId: 'a' }),
    );
    expect(d).toMatchObject({ action: 'A1', loId: 'b' });
  });

  it('lựa chọn khác không trùng đề xuất chính và tối đa hai', () => {
    const d = plan(input([lo('a'), lo('b'), lo('c')], { currentLoId: 'a' }));
    expect(d).toMatchObject({ action: 'A1', loId: 'a' });
    expect(d.alternatives).toEqual([
      { action: 'A3', loId: 'a' },
      { action: 'A5', loId: 'b' },
    ]);
  });
});

describe('lịch ôn Leitner', () => {
  it('tính ngày theo giờ Việt Nam', () => {
    // 23:30 ngày 4/11 giờ VN là 16:30Z; "ngày mai" bắt đầu 00:00 ngày 5/11 giờ VN = 17:00Z ngày 4/11.
    expect(
      localDayStart(new Date('2026-11-04T16:30:00Z'), 1).toISOString(),
    ).toBe('2026-11-04T17:00:00.000Z');
    // 00:30 ngày 5/11 giờ VN đã là ngày 5: ngày mai là 6/11.
    expect(
      localDayStart(new Date('2026-11-04T17:30:00Z'), 1).toISOString(),
    ).toBe('2026-11-05T17:00:00.000Z');
  });

  it('đạt thì vào hộp đầu; ôn đúng lên một hộp; ôn sai về hộp đầu và cần xác nhận lại', () => {
    const t0 = new Date('2026-11-05T03:00:00Z');
    const entry = enterReview('a', t0);
    expect(entry).toMatchObject({ box: 0, needsRecheck: false });
    expect(isDue(entry, t0)).toBe(false);
    expect(isDue(entry, new Date('2026-11-05T17:00:00Z'))).toBe(true);

    const up = applyReview(entry, true, new Date('2026-11-06T03:00:00Z'));
    expect(up.box).toBe(1);
    expect(up.dueAt.toISOString()).toBe('2026-11-08T17:00:00.000Z');

    const down = applyReview(
      { ...up, box: 3 },
      false,
      new Date('2026-11-09T03:00:00Z'),
    );
    expect(down).toMatchObject({ box: 0, needsRecheck: true });
    expect(isDue(down, new Date('2026-11-09T03:00:00Z'))).toBe(true);
  });

  it('hộp cuối không vượt quá', () => {
    const entry = { ...enterReview('a', new Date()), box: 4 };
    expect(applyReview(entry, true, new Date()).box).toBe(4);
  });
});
