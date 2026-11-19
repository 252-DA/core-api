import { Prisma } from '@prisma/client';
import type { NormalizedCurriculum } from '../handlers/curriculum-payload';
import { curriculumIds, stableUuid } from '../domain/stable-uuid';

/**
 * Ghi đề cương đã duyệt vào 9 bảng: courses, chapters, learning_outcomes,
 * chapter_los, course_goals, course_sessions, assessments, lo_assessments,
 * curriculum_extraction_issues.
 *
 * Chép đúng ngữ nghĩa của SQL Python cũ (packages-ai
 * PostgresCurriculumRepository.upsert_curriculum + ánh xạ
 * IngestCurriculumUseCase._persist_to_postgres), đã đối chiếu bằng
 * curriculum-writer.integration.spec.ts:
 * - id tất định như stable_uuid cũ ⇒ áp lại cùng đề cương cập nhật đúng hàng cũ;
 * - upsert theo cùng khoá ON CONFLICT, ghi đè cùng các cột; không xoá chương /
 *   LO / đánh giá không còn trong đề cương (giống trước);
 * - courses: ghi đè code (mã DCMH), name, description;
 * - issue chưa xử lý của học phần bị xoá rồi ghi lại theo lần này.
 * Khác: mỗi bảng một câu INSERT nhiều dòng (thay executemany từng dòng) để cả
 * lần áp dụng nằm gọn trong một transaction ngắn. Một câu không được đụng một
 * khoá hai lần, nên phần tử trùng khoá được gộp, phần tử sau thắng — đúng kết
 * quả executemany tuần tự cũ.
 */

const ASSESSMENT_TYPES = new Map([
  ['quiz', 'QUIZ'],
  ['group_quiz', 'PROJECT'], // GPJ-Project nhóm trong DCMH
  ['project', 'PROJECT'],
  ['midterm', 'MIDTERM'],
  ['final', 'FINAL_EXAM'],
]);

/** Như _assessment_type cũ: giá trị assessments_type_check cho phép. */
export function assessmentType(category: string): string {
  return ASSESSMENT_TYPES.get((category || '').toLowerCase()) ?? 'ASSIGNMENT';
}

export interface ChapterRow {
  chapter_id: string;
  code: string;
  title: string;
  title_en: string | null;
  sort_order: number;
  source_section: string | null;
  source_page: number | null;
  topics: string | null;
}

export interface LearningOutcomeRow {
  lo_id: string;
  code: string;
  parent_code: string | null;
  statement_vi: string;
  statement_en: string | null;
  bloom_level: number | null;
  bloom_provenance: string;
  cdio_level: string | null;
  cdio_provenance: string;
  source_section: string | null;
  source_page: number | null;
}

export interface ChapterLoRow {
  chapter_id: string;
  lo_id: string;
  provenance: string;
  source_section: string | null;
  source_page: number | null;
}

export interface GoalRow {
  code: string;
  statement_vi: string;
  statement_en: string | null;
  source_section: string | null;
  source_page: number | null;
}

export interface SessionRow {
  order_index: number;
  session_no: number | null;
  chapter_id: string | null;
  title_vi: string;
  title_en: string | null;
  source_section: string | null;
  source_page: number | null;
}

export interface AssessmentRow {
  assessment_id: string;
  code: string;
  parent_code: string | null;
  title: string;
  title_en: string | null;
  activity_type: string | null;
  weight: number | null;
  weight_provenance: string;
  sort_order: number;
  type: string;
  source_section: string | null;
  source_page: number | null;
}

export interface LoAssessmentRow {
  lo_id: string;
  assessment_id: string;
  session_order: number;
  scope: 'session' | 'course';
  chapter_id: string | null;
  provenance: string;
  source_section: string | null;
  source_page: number | null;
}

export interface IssueRow {
  document_id: string | null;
  code: string;
  severity: string;
  message: string;
  source_section: string | null;
  source_page: number | null;
  source_locator: string | null;
}

export interface CurriculumRows {
  courseId: string;
  course: { code: string; name: string; description: string | null };
  chapters: ChapterRow[];
  learningOutcomes: LearningOutcomeRow[];
  chapterLos: ChapterLoRow[];
  goals: GoalRow[];
  sessions: SessionRow[];
  assessments: AssessmentRow[];
  loAssessments: LoAssessmentRow[];
  issues: IssueRow[];
}

export type CurriculumWriteSummary = {
  [K in Exclude<keyof CurriculumRows, 'courseId' | 'course'>]: number;
};

/** Gộp phần tử trùng khoá, phần tử sau thắng (như executemany tuần tự). */
function lastByKey<T>(rows: T[], key: (row: T) => string): T[] {
  const byKey = new Map<string, T>();
  for (const row of rows) byKey.set(key(row), row);
  return [...byKey.values()];
}

/**
 * Tính mọi hàng sẽ ghi (thuần, không đụng DB). `courseId` là học phần của lần
 * nạp, cũng là course_id_hint worker đưa cho extractor.
 */
export function buildCurriculumRows(
  courseId: string,
  curriculum: NormalizedCurriculum,
): CurriculumRows {
  const chapterIds = new Map(
    curriculum.chapters.map((c) => [
      c.code,
      curriculumIds.chapter(courseId, c.code),
    ]),
  );
  const loIds = new Map(
    curriculum.learning_outcomes.map((lo) => [
      lo.code,
      curriculumIds.learningOutcome(courseId, lo.code),
    ]),
  );
  const assessmentIds = new Map(
    curriculum.assessments.map((a) => [
      a.code,
      curriculumIds.assessment(courseId, a.code),
    ]),
  );
  // `chapter_id_by_code.get(code) if code else None` của bản cũ.
  const chapterIdOrNull = (code: string | null) =>
    code ? (chapterIds.get(code) ?? null) : null;
  const { course } = curriculum;

  return {
    courseId,
    course: {
      code: course.code,
      name: course.title_vi,
      // `title_en or semester` của Python: chuỗi rỗng cũng rơi sang semester.
      description: course.title_en ? course.title_en : course.semester,
    },
    chapters: lastByKey(
      curriculum.chapters.map((c) => ({
        chapter_id: chapterIds.get(c.code)!,
        code: c.code,
        title: c.title,
        title_en: c.title_en,
        sort_order: c.order_index,
        source_section: c.source_section,
        source_page: c.source_page,
        topics: c.topics.join('; ') || null,
      })),
      (r) => r.chapter_id,
    ),
    learningOutcomes: lastByKey(
      curriculum.learning_outcomes.map((lo) => ({
        lo_id: loIds.get(lo.code)!,
        code: lo.code,
        parent_code: lo.parent_code,
        statement_vi: lo.statement_vi,
        statement_en: lo.statement_en,
        bloom_level: lo.bloom_level,
        bloom_provenance: lo.bloom_provenance,
        cdio_level: lo.cdio_level,
        cdio_provenance: lo.cdio_provenance,
        source_section: lo.source_section,
        source_page: lo.source_page,
      })),
      (r) => r.code,
    ),
    // Cạnh trỏ tới mã không có trong đề cương bị bỏ, như bản cũ.
    chapterLos: lastByKey(
      curriculum.chapter_lo_links
        .filter((l) => chapterIds.has(l.chapter_code) && loIds.has(l.lo_code))
        .map((l) => ({
          chapter_id: chapterIds.get(l.chapter_code)!,
          lo_id: loIds.get(l.lo_code)!,
          provenance: l.provenance,
          source_section: l.source_section,
          source_page: l.source_page,
        })),
      (r) => `${r.chapter_id}|${r.lo_id}`,
    ),
    goals: lastByKey(
      curriculum.goals.map((g) => ({
        code: g.code,
        statement_vi: g.statement_vi,
        statement_en: g.statement_en,
        source_section: g.source_section,
        source_page: g.source_page,
      })),
      (r) => r.code,
    ),
    sessions: lastByKey(
      curriculum.sessions.map((s) => ({
        order_index: s.order_index,
        session_no: s.session_no,
        chapter_id: chapterIdOrNull(s.chapter_code),
        title_vi: s.title_vi,
        title_en: s.title_en,
        source_section: s.source_section,
        source_page: s.source_page,
      })),
      (r) => String(r.order_index),
    ),
    // sort_order = vị trí trong danh sách gốc (trước khi gộp), như enumerate cũ.
    assessments: lastByKey(
      curriculum.assessments.map((a, index) => ({
        assessment_id: assessmentIds.get(a.code)!,
        code: a.code,
        parent_code: a.parent_code,
        title: a.name_vi,
        title_en: a.name_en,
        activity_type: a.activity_type,
        weight: a.weight,
        weight_provenance: a.weight_provenance,
        sort_order: index + 1,
        type: assessmentType(a.category),
        source_section: a.source_section,
        source_page: a.source_page,
      })),
      (r) => r.assessment_id,
    ),
    loAssessments: lastByKey(
      curriculum.lo_assessment_links
        .filter(
          (l) => loIds.has(l.lo_code) && assessmentIds.has(l.assessment_code),
        )
        .map((l) => ({
          lo_id: loIds.get(l.lo_code)!,
          assessment_id: assessmentIds.get(l.assessment_code)!,
          // `row_order_index or 0`: cạnh chung của mục 5.3 nằm ở session_order 0.
          session_order: l.row_order_index ?? 0,
          scope:
            l.row_order_index !== null
              ? ('session' as const)
              : ('course' as const),
          chapter_id: chapterIdOrNull(l.chapter_code),
          provenance: l.provenance,
          source_section: l.source_section,
          source_page: l.source_page,
        })),
      (r) => `${r.lo_id}|${r.assessment_id}|${r.session_order}`,
    ),
    // Issue không có khoá: ghi đủ, kể cả trùng.
    issues: curriculum.issues.map((i) => ({
      document_id: curriculum.source_document_id
        ? stableUuid(curriculum.source_document_id)
        : null,
      code: i.code,
      severity: i.severity,
      message: i.message,
      source_section: i.source_section,
      source_page: i.source_page,
      source_locator: i.source_locator,
    })),
  };
}

type Tx = Pick<Prisma.TransactionClient, '$executeRaw'>;

/**
 * Ghi đề cương trong transaction `tx` của người gọi (áp dụng import ghi cùng
 * trạng thái import và sự kiện outbox). Ném lỗi thì người gọi rollback cả lần.
 */
export async function writeCurriculum(
  tx: Tx,
  courseId: string,
  curriculum: NormalizedCurriculum,
): Promise<CurriculumWriteSummary> {
  const rows = buildCurriculumRows(courseId, curriculum);
  const c = Prisma.sql`${courseId}::uuid`;

  // courses: hàng do LTI tạo luôn có sẵn (curriculum_imports tham chiếu nó).
  // Mã học phần ghi vào subject_code, giữ nguyên code (mã LTI) để nhiều lớp
  // cùng môn nạp đề cương không đụng ràng buộc unique courses_code_key.
  const updated = await tx.$executeRaw`
    UPDATE courses
       SET subject_code = ${rows.course.code}::text, name = ${rows.course.name}::text,
           description = ${rows.course.description}::text, updated_at = NOW()
     WHERE course_id = ${c}`;
  if (updated !== 1)
    throw new Error(`Không thấy học phần ${courseId} để ghi đề cương.`);

  if (rows.chapters.length) {
    await tx.$executeRaw`
      INSERT INTO chapters (
        chapter_id, course_id, code, title, title_en,
        sort_order, source_section, source_page, topics, deleted_at
      )
      VALUES ${Prisma.join(
        rows.chapters.map(
          (
            r,
          ) => Prisma.sql`(${r.chapter_id}::uuid, ${c}, ${r.code}::text, ${r.title}::text,
            ${r.title_en}::text, ${r.sort_order}::int, ${r.source_section}::text,
            ${r.source_page}::int, ${r.topics}::text, NULL)`,
        ),
      )}
      ON CONFLICT (chapter_id) DO UPDATE SET
        code = EXCLUDED.code,
        title = EXCLUDED.title,
        title_en = EXCLUDED.title_en,
        sort_order = EXCLUDED.sort_order,
        source_section = EXCLUDED.source_section,
        source_page = EXCLUDED.source_page,
        topics = EXCLUDED.topics,
        deleted_at = NULL`;
  }

  if (rows.learningOutcomes.length) {
    // LO gắn vào học phần; quan hệ chương ↔ LO nằm ở chapter_los.
    await tx.$executeRaw`
      INSERT INTO learning_outcomes (
        lo_id, course_id, code, parent_code, statement_vi, statement_en,
        bloom_level, bloom_provenance, cdio_level, cdio_provenance,
        source_section, source_page, academic_year, version, is_current, deleted_at
      )
      VALUES ${Prisma.join(
        rows.learningOutcomes.map(
          (
            r,
          ) => Prisma.sql`(${r.lo_id}::uuid, ${c}, ${r.code}::text, ${r.parent_code}::text,
            ${r.statement_vi}::text, ${r.statement_en}::text, ${r.bloom_level}::int,
            ${r.bloom_provenance}::text, ${r.cdio_level}::text, ${r.cdio_provenance}::text,
            ${r.source_section}::text, ${r.source_page}::int, 'default', 1, TRUE, NULL)`,
        ),
      )}
      ON CONFLICT (course_id, code, academic_year, version) DO UPDATE SET
        parent_code = EXCLUDED.parent_code,
        statement_vi = EXCLUDED.statement_vi,
        statement_en = EXCLUDED.statement_en,
        bloom_level = EXCLUDED.bloom_level,
        bloom_provenance = EXCLUDED.bloom_provenance,
        cdio_level = EXCLUDED.cdio_level,
        cdio_provenance = EXCLUDED.cdio_provenance,
        source_section = EXCLUDED.source_section,
        source_page = EXCLUDED.source_page,
        is_current = TRUE,
        deleted_at = NULL`;
  }

  if (rows.chapterLos.length) {
    await tx.$executeRaw`
      INSERT INTO chapter_los (chapter_id, lo_id, provenance, source_section, source_page)
      VALUES ${Prisma.join(
        rows.chapterLos.map(
          (
            r,
          ) => Prisma.sql`(${r.chapter_id}::uuid, ${r.lo_id}::uuid, ${r.provenance}::text,
            ${r.source_section}::text, ${r.source_page}::int)`,
        ),
      )}
      ON CONFLICT (chapter_id, lo_id) DO UPDATE SET
        provenance = EXCLUDED.provenance,
        source_section = EXCLUDED.source_section,
        source_page = EXCLUDED.source_page`;
  }

  if (rows.goals.length) {
    await tx.$executeRaw`
      INSERT INTO course_goals (
        course_id, code, statement_vi, statement_en, source_section, source_page
      )
      VALUES ${Prisma.join(
        rows.goals.map(
          (r) => Prisma.sql`(${c}, ${r.code}::text, ${r.statement_vi}::text,
            ${r.statement_en}::text, ${r.source_section}::text, ${r.source_page}::int)`,
        ),
      )}
      ON CONFLICT (course_id, code) DO UPDATE SET
        statement_vi = EXCLUDED.statement_vi,
        statement_en = EXCLUDED.statement_en,
        source_section = EXCLUDED.source_section,
        source_page = EXCLUDED.source_page`;
  }

  if (rows.sessions.length) {
    await tx.$executeRaw`
      INSERT INTO course_sessions (
        course_id, order_index, session_no, chapter_id,
        title_vi, title_en, source_section, source_page
      )
      VALUES ${Prisma.join(
        rows.sessions.map(
          (r) => Prisma.sql`(${c}, ${r.order_index}::int, ${r.session_no}::int,
            ${r.chapter_id}::uuid, ${r.title_vi}::text, ${r.title_en}::text,
            ${r.source_section}::text, ${r.source_page}::int)`,
        ),
      )}
      ON CONFLICT (course_id, order_index) DO UPDATE SET
        session_no = EXCLUDED.session_no,
        chapter_id = EXCLUDED.chapter_id,
        title_vi = EXCLUDED.title_vi,
        title_en = EXCLUDED.title_en,
        source_section = EXCLUDED.source_section,
        source_page = EXCLUDED.source_page`;
  }

  if (rows.assessments.length) {
    await tx.$executeRaw`
      INSERT INTO assessments (
        assessment_id, course_id, code, parent_code, title, title_en, activity_type,
        max_points, weight, weight_provenance, sort_order, type,
        source_section, source_page, deleted_at
      )
      VALUES ${Prisma.join(
        rows.assessments.map(
          (r) => Prisma.sql`(${r.assessment_id}::uuid, ${c}, ${r.code}::text,
            ${r.parent_code}::text, ${r.title}::text, ${r.title_en}::text,
            ${r.activity_type}::text, 100, ${r.weight}::numeric, ${r.weight_provenance}::text,
            ${r.sort_order}::int, ${r.type}::text, ${r.source_section}::text,
            ${r.source_page}::int, NULL)`,
        ),
      )}
      ON CONFLICT (assessment_id) DO UPDATE SET
        code = EXCLUDED.code,
        parent_code = EXCLUDED.parent_code,
        title = EXCLUDED.title,
        title_en = EXCLUDED.title_en,
        activity_type = EXCLUDED.activity_type,
        max_points = EXCLUDED.max_points,
        weight = EXCLUDED.weight,
        weight_provenance = EXCLUDED.weight_provenance,
        sort_order = EXCLUDED.sort_order,
        type = EXCLUDED.type,
        source_section = EXCLUDED.source_section,
        source_page = EXCLUDED.source_page,
        deleted_at = NULL`;
  }

  if (rows.loAssessments.length) {
    await tx.$executeRaw`
      INSERT INTO lo_assessments (
        lo_id, assessment_id, session_order, scope, chapter_id,
        provenance, source_section, source_page
      )
      VALUES ${Prisma.join(
        rows.loAssessments.map(
          (
            r,
          ) => Prisma.sql`(${r.lo_id}::uuid, ${r.assessment_id}::uuid, ${r.session_order}::int,
            ${r.scope}::text, ${r.chapter_id}::uuid, ${r.provenance}::text,
            ${r.source_section}::text, ${r.source_page}::int)`,
        ),
      )}
      ON CONFLICT (lo_id, assessment_id, session_order) DO UPDATE SET
        scope = EXCLUDED.scope,
        chapter_id = EXCLUDED.chapter_id,
        provenance = EXCLUDED.provenance,
        source_section = EXCLUDED.source_section,
        source_page = EXCLUDED.source_page`;
  }

  // Kết quả soát của lần này thay cho các issue chưa xử lý của lần trước, để
  // màn hình kiểm tra không tồn đọng.
  await tx.$executeRaw`
    DELETE FROM curriculum_extraction_issues
     WHERE course_id = ${c} AND resolved_at IS NULL`;
  if (rows.issues.length) {
    await tx.$executeRaw`
      INSERT INTO curriculum_extraction_issues (
        course_id, document_id, code, severity, message,
        source_section, source_page, source_locator
      )
      VALUES ${Prisma.join(
        rows.issues.map(
          (
            r,
          ) => Prisma.sql`(${c}, ${r.document_id}::uuid, ${r.code}::text, ${r.severity}::text,
            ${r.message}::text, ${r.source_section}::text, ${r.source_page}::int,
            ${r.source_locator}::text)`,
        ),
      )}`;
  }

  return {
    chapters: rows.chapters.length,
    learningOutcomes: rows.learningOutcomes.length,
    chapterLos: rows.chapterLos.length,
    goals: rows.goals.length,
    sessions: rows.sessions.length,
    assessments: rows.assessments.length,
    loAssessments: rows.loAssessments.length,
    issues: rows.issues.length,
  };
}
