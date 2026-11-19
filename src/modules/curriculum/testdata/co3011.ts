import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONTRACTS_DIR } from '../../../testing/repo-paths';
import type { NormalizedCurriculum } from '../handlers/curriculum-payload';
import type { CurriculumRows } from '../services/curriculum-writer';

/**
 * Dữ liệu chung cho test đề cương (chỉ spec import; không phải code chạy thật):
 * - CO3011_ENVELOPE: kết quả worker cho đề cương CO3011 thật (fixture hợp đồng);
 * - PYTHON_ROWS: 9 bảng do SQL Python cũ (upsert_curriculum, ghi 2 lần) ghi cho
 *   đúng đề cương đó trên PG18 tạm — co3011-python-rows.json cạnh file này.
 */
export const CO3011_ENVELOPE = JSON.parse(
  readFileSync(
    join(
      CONTRACTS_DIR,
      'fixtures',
      'v1',
      'valid',
      'curriculum-import-result.json',
    ),
    'utf8',
  ),
);
export const CO3011_CURRICULUM = CO3011_ENVELOPE.payload
  .curriculum as NormalizedCurriculum;

const golden = JSON.parse(
  readFileSync(join(__dirname, 'co3011-python-rows.json'), 'utf8'),
);
export const GOLDEN_COURSE_ID: string = golden.course_id;
export type TableDump = Record<string, Array<Record<string, unknown>>>;
export const PYTHON_ROWS: TableDump = golden.rows;

/** Khoá sắp xếp mỗi bảng, như ORDER BY của câu dump nhưng sắp bằng JS (không lệ thuộc collation). */
const SORT_KEYS: Record<string, string[]> = {
  courses: ['course_id'],
  chapters: ['code'],
  learning_outcomes: ['code'],
  chapter_los: ['chapter_id', 'lo_id'],
  course_goals: ['code'],
  course_sessions: ['order_index'],
  assessments: ['code'],
  lo_assessments: ['lo_id', 'assessment_id', 'session_order'],
  curriculum_extraction_issues: ['code', 'message', 'source_section'],
};

export function sortDump(dump: TableDump): TableDump {
  const out: TableDump = {};
  for (const [table, rows] of Object.entries(dump)) {
    const keys = SORT_KEYS[table];
    out[table] = [...rows].sort((a, b) => {
      for (const key of keys) {
        const x = String(a[key] ?? '');
        const y = String(b[key] ?? '');
        if (x !== y) {
          return typeof a[key] === 'number'
            ? (a[key] as number) - (b[key] as number)
            : x < y
              ? -1
              : 1;
        }
      }
      return 0;
    });
  }
  return out;
}

/** Hàng writer sẽ ghi, đưa về đúng dạng câu dump (cột mặc định của DB điền sẵn). */
export function rowsAsDump(rows: CurriculumRows): TableDump {
  const course_id = rows.courseId;
  const weight = (w: number | null) => (w === null ? null : w.toFixed(4));
  return {
    courses: [{ course_id, ...rows.course }],
    chapters: rows.chapters.map((r) => ({ ...r, course_id, live: true })),
    learning_outcomes: rows.learningOutcomes.map((r) => ({
      ...r,
      course_id,
      academic_year: 'default',
      version: 1,
      is_current: true,
      live: true,
    })),
    chapter_los: rows.chapterLos.map((r) => ({ ...r })),
    course_goals: rows.goals.map((r) => ({ ...r, course_id })),
    course_sessions: rows.sessions.map((r) => ({ ...r, course_id })),
    assessments: rows.assessments.map((r) => ({
      ...r,
      course_id,
      max_points: '100.00',
      weight: weight(r.weight),
      live: true,
    })),
    lo_assessments: rows.loAssessments.map((r) => ({
      ...r,
      weight: null,
      weight_provenance: 'inferred',
    })),
    curriculum_extraction_issues: rows.issues.map((r) => ({
      ...r,
      course_id,
      open: true,
    })),
  };
}

/** Câu dump 9 bảng của một học phần, giống hệt câu đã dùng sinh PYTHON_ROWS. */
export const DUMP_SQL = `
SELECT json_build_object(
  'courses', (SELECT coalesce(json_agg(t), '[]') FROM (
      SELECT course_id, code, name, description
        FROM courses WHERE course_id = $1::uuid) t),
  'chapters', (SELECT coalesce(json_agg(t ORDER BY t.code), '[]') FROM (
      SELECT chapter_id, course_id, code, title, title_en, sort_order, topics,
             source_section, source_page, deleted_at IS NULL AS live
        FROM chapters WHERE course_id = $1::uuid) t),
  'learning_outcomes', (SELECT coalesce(json_agg(t ORDER BY t.code), '[]') FROM (
      SELECT lo_id, course_id, code, parent_code, statement_vi, statement_en,
             bloom_level, bloom_provenance, cdio_level, cdio_provenance,
             source_section, source_page, academic_year, version, is_current,
             deleted_at IS NULL AS live
        FROM learning_outcomes WHERE course_id = $1::uuid) t),
  'chapter_los', (SELECT coalesce(json_agg(t ORDER BY t.chapter_id, t.lo_id), '[]') FROM (
      SELECT cl.chapter_id, cl.lo_id, cl.provenance, cl.source_section, cl.source_page
        FROM chapter_los cl JOIN chapters ch ON ch.chapter_id = cl.chapter_id
       WHERE ch.course_id = $1::uuid) t),
  'course_goals', (SELECT coalesce(json_agg(t ORDER BY t.code), '[]') FROM (
      SELECT course_id, code, statement_vi, statement_en, source_section, source_page
        FROM course_goals WHERE course_id = $1::uuid) t),
  'course_sessions', (SELECT coalesce(json_agg(t ORDER BY t.order_index), '[]') FROM (
      SELECT course_id, order_index, session_no, chapter_id, title_vi, title_en,
             source_section, source_page
        FROM course_sessions WHERE course_id = $1::uuid) t),
  'assessments', (SELECT coalesce(json_agg(t ORDER BY t.code), '[]') FROM (
      SELECT assessment_id, course_id, code, parent_code, title, title_en, activity_type,
             max_points::text AS max_points, weight::text AS weight, weight_provenance,
             sort_order, type, source_section, source_page, deleted_at IS NULL AS live
        FROM assessments WHERE course_id = $1::uuid) t),
  'lo_assessments', (SELECT coalesce(json_agg(t ORDER BY t.lo_id, t.assessment_id, t.session_order), '[]') FROM (
      SELECT la.lo_id, la.assessment_id, la.session_order, la.scope, la.chapter_id,
             la.weight::text AS weight, la.weight_provenance, la.provenance,
             la.source_section, la.source_page
        FROM lo_assessments la JOIN assessments a ON a.assessment_id = la.assessment_id
       WHERE a.course_id = $1::uuid) t),
  'curriculum_extraction_issues', (SELECT coalesce(json_agg(t ORDER BY t.code, t.message), '[]') FROM (
      SELECT course_id, document_id, code, severity, message, source_section,
             source_page, source_locator, resolved_at IS NULL AS open
        FROM curriculum_extraction_issues WHERE course_id = $1::uuid) t)
)::text AS dump`;
