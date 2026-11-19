import type { NormalizedCurriculum } from '../handlers/curriculum-payload';
import {
  assessmentType,
  buildCurriculumRows,
  writeCurriculum,
} from './curriculum-writer';
import { curriculumIds, stableUuid, uuid5Url } from '../domain/stable-uuid';
import {
  CO3011_CURRICULUM,
  GOLDEN_COURSE_ID,
  PYTHON_ROWS,
  rowsAsDump,
  sortDump,
} from '../testdata/co3011';

function clone(): NormalizedCurriculum {
  return JSON.parse(JSON.stringify(CO3011_CURRICULUM));
}

describe('stableUuid', () => {
  it('matches Python uuid.uuid5(NAMESPACE_URL, …)', () => {
    // python3 -c "import uuid; print(uuid.uuid5(uuid.NAMESPACE_URL, 'CO3011'))"
    expect(uuid5Url('CO3011')).toBe('3c9d43ac-24e8-5ea5-808c-8f5c5b7497a2');
    expect(uuid5Url('Đề cương')).toBe('051bb001-4796-56ab-a8a8-d9674a65fe76');
  });

  it('keeps a value that already is a UUID, normalised like uuid.UUID()', () => {
    const id = '01900000-0000-7000-8000-0000000000dd';
    expect(stableUuid(id)).toBe(id);
    expect(stableUuid(id.toUpperCase())).toBe(id);
    expect(stableUuid(`{${id}}`)).toBe(id);
    expect(stableUuid(`urn:uuid:${id}`)).toBe(id);
    expect(stableUuid(id.replace(/-/g, ''))).toBe(id);
  });

  it('reproduces the ids the Python writer stored for CO3011', () => {
    for (const lo of PYTHON_ROWS.learning_outcomes) {
      expect(
        curriculumIds.learningOutcome(GOLDEN_COURSE_ID, lo.code as string),
      ).toBe(lo.lo_id);
    }
    for (const ch of PYTHON_ROWS.chapters) {
      expect(curriculumIds.chapter(GOLDEN_COURSE_ID, ch.code as string)).toBe(
        ch.chapter_id,
      );
    }
    for (const a of PYTHON_ROWS.assessments) {
      expect(curriculumIds.assessment(GOLDEN_COURSE_ID, a.code as string)).toBe(
        a.assessment_id,
      );
    }
  });
});

describe('buildCurriculumRows', () => {
  it('produces exactly the rows the Python upsert_curriculum wrote for CO3011', () => {
    const rows = buildCurriculumRows(GOLDEN_COURSE_ID, CO3011_CURRICULUM);

    expect(sortDump(rowsAsDump(rows))).toEqual(sortDump(PYTHON_ROWS));
  });

  it('maps categories to assessments.type like the old repository', () => {
    expect(
      [
        'quiz',
        'GROUP_QUIZ',
        'project',
        'midterm',
        'final',
        'essay',
        '',
        'constructor',
      ].map(assessmentType),
    ).toEqual([
      'QUIZ',
      'PROJECT',
      'PROJECT',
      'MIDTERM',
      'FINAL_EXAM',
      'ASSIGNMENT',
      'ASSIGNMENT',
      'ASSIGNMENT',
    ]);
  });

  it('keeps the last of duplicate keys, as sequential executemany did', () => {
    const c = clone();
    c.learning_outcomes.push({
      ...c.learning_outcomes[0],
      statement_vi: 'bản sau',
    });
    c.chapters.push({ ...c.chapters[0], title: 'chương sau' });
    c.sessions.push({ ...c.sessions[0], title_vi: 'buổi sau' });
    c.goals.push({ ...c.goals[0], statement_vi: 'mục tiêu sau' });
    c.chapter_lo_links.push({
      ...c.chapter_lo_links[0],
      provenance: 'confirmed',
    });

    const rows = buildCurriculumRows(GOLDEN_COURSE_ID, c);

    expect(rows.learningOutcomes).toHaveLength(9);
    expect(
      rows.learningOutcomes.find((r) => r.code === c.learning_outcomes[0].code)
        ?.statement_vi,
    ).toBe('bản sau');
    expect(rows.chapters).toHaveLength(12);
    expect(
      rows.chapters.find((r) => r.code === c.chapters[0].code)?.title,
    ).toBe('chương sau');
    expect(rows.sessions).toHaveLength(15);
    expect(rows.goals).toHaveLength(2);
    expect(rows.chapterLos).toHaveLength(12);
    expect(
      rows.chapterLos.filter((r) => r.provenance === 'confirmed'),
    ).toHaveLength(1);
  });

  it('gives a duplicated assessment the position of its last occurrence', () => {
    const c = clone();
    c.assessments.push({ ...c.assessments[0], name_vi: 'đánh giá sau' });

    const a = buildCurriculumRows(GOLDEN_COURSE_ID, c).assessments.find(
      (r) => r.code === c.assessments[0].code,
    );

    expect(a).toMatchObject({ title: 'đánh giá sau', sort_order: 4 });
  });

  it('drops links to unknown codes and nulls unknown chapters, like the old mapping', () => {
    const c = clone();
    c.chapter_lo_links.push({ ...c.chapter_lo_links[0], chapter_code: '99' });
    c.lo_assessment_links.push({
      ...c.lo_assessment_links[0],
      assessment_code: 'A.O.9',
    });
    c.lo_assessment_links.push({
      ...c.lo_assessment_links[0],
      row_order_index: 42,
      chapter_code: '99',
    });
    c.sessions[0].chapter_code = '99';

    const rows = buildCurriculumRows(GOLDEN_COURSE_ID, c);

    expect(rows.chapterLos).toHaveLength(12);
    expect(rows.loAssessments).toHaveLength(39);
    expect(
      rows.loAssessments.find((r) => r.session_order === 42),
    ).toMatchObject({
      scope: 'session',
      chapter_id: null,
    });
    expect(
      rows.sessions.find((r) => r.order_index === c.sessions[0].order_index)
        ?.chapter_id,
    ).toBeNull();
  });

  it('treats row_order_index 0 as a session edge at session_order 0', () => {
    const c = clone();
    c.lo_assessment_links = [
      { ...c.lo_assessment_links[0], row_order_index: 0 },
    ];

    expect(
      buildCurriculumRows(GOLDEN_COURSE_ID, c).loAssessments[0],
    ).toMatchObject({
      session_order: 0,
      scope: 'session',
    });
  });

  it('falls back to the semester when the English title is missing or empty', () => {
    const c = clone();
    c.course.title_en = '';
    expect(buildCurriculumRows(GOLDEN_COURSE_ID, c).course.description).toBe(
      c.course.semester,
    );
    c.course.title_en = null;
    c.course.semester = null;
    expect(
      buildCurriculumRows(GOLDEN_COURSE_ID, c).course.description,
    ).toBeNull();
  });

  it('keeps every issue, duplicates included, and maps a non-UUID document id', () => {
    const c = clone();
    c.issues.push({ ...c.issues[0] });
    c.source_document_id = 'dcmh';

    const rows = buildCurriculumRows(GOLDEN_COURSE_ID, c);

    expect(rows.issues).toHaveLength(8);
    expect(rows.issues[0].document_id).toBe(uuid5Url('dcmh'));
  });
});

describe('writeCurriculum', () => {
  function fakeTx(courseRows = 1) {
    const sql: string[] = [];
    const tx = {
      $executeRaw: jest.fn(
        (strings: TemplateStringsArray | { sql: string }) => {
          sql.push(
            Array.isArray(strings)
              ? strings.join('?')
              : (strings as { sql: string }).sql,
          );
          return Promise.resolve(sql.length === 1 ? courseRows : 1);
        },
      ),
    };
    return { tx, sql };
  }

  it('writes the nine tables with one statement each, issues replaced last', async () => {
    const { tx, sql } = fakeTx();

    const summary = await writeCurriculum(
      tx as never,
      GOLDEN_COURSE_ID,
      CO3011_CURRICULUM,
    );

    expect(summary).toEqual({
      chapters: 12,
      learningOutcomes: 9,
      chapterLos: 12,
      goals: 2,
      sessions: 15,
      assessments: 3,
      loAssessments: 38,
      issues: 7,
    });
    const tables = sql.map((s) =>
      /(UPDATE|INSERT INTO|DELETE FROM)\s+(\w+)/.exec(s)?.slice(1).join(' '),
    );
    expect(tables).toEqual([
      'UPDATE courses',
      'INSERT INTO chapters',
      'INSERT INTO learning_outcomes',
      'INSERT INTO chapter_los',
      'INSERT INTO course_goals',
      'INSERT INTO course_sessions',
      'INSERT INTO assessments',
      'INSERT INTO lo_assessments',
      'DELETE FROM curriculum_extraction_issues',
      'INSERT INTO curriculum_extraction_issues',
    ]);
  });

  it('skips empty lists but still clears unresolved issues', async () => {
    const { tx, sql } = fakeTx();
    const c = clone();
    for (const key of [
      'chapters',
      'learning_outcomes',
      'chapter_lo_links',
      'goals',
      'sessions',
      'assessments',
      'lo_assessment_links',
      'issues',
    ] as const) {
      c[key] = [];
    }

    await writeCurriculum(tx as never, GOLDEN_COURSE_ID, c);

    expect(sql.map((s) => s.trim().split(/\s+/).slice(0, 3).join(' '))).toEqual(
      ['UPDATE courses SET', 'DELETE FROM curriculum_extraction_issues'],
    );
  });

  it('refuses to write when the course row is missing', async () => {
    const { tx } = fakeTx(0);

    await expect(
      writeCurriculum(tx as never, GOLDEN_COURSE_ID, CO3011_CURRICULUM),
    ).rejects.toThrow(/Không thấy học phần/);
  });
});
