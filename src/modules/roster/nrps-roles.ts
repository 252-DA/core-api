import { COURSE_ROLES } from '../../common/constants/course-roles';

/** Vai trò trong một khóa học của DA (khớp course_memberships.role). */
export type CourseRole = 'instructor' | 'ta' | 'learner' | 'observer';
/** Vai trò trên toàn nền tảng (khớp lms_user_mappings.role). */
export type PlatformRole = 'instructor' | 'learner';

const MEMBERSHIP = 'http://purl.imsglobal.org/vocab/lis/v2/membership';

const TA_ROLE = `${MEMBERSHIP}/Instructor#TeachingAssistant`;
const INSTRUCTOR_ROLES = [
  `${MEMBERSHIP}#Instructor`,
  `${MEMBERSHIP}#ContentDeveloper`,
];
const OBSERVER_ROLES = [`${MEMBERSHIP}#Mentor`];
const LEARNER_ROLES = [`${MEMBERSHIP}#Learner`, `${MEMBERSHIP}#Member`];

/**
 * Role của một thành viên NRPS, so khớp URI chính xác (không dùng regex: mọi URI
 * đều chứa "membership"). Canvas gửi trợ giảng kèm cả `membership#Instructor`
 * nên trợ giảng phải được xét trước giảng viên. Role lạ trả null để bỏ qua.
 */
export function courseRoleFromNrps(roles: readonly string[]): CourseRole | null {
  const has = (candidates: readonly string[]) =>
    roles.some((role) => candidates.includes(role));
  if (roles.includes(TA_ROLE)) return COURSE_ROLES.TA;
  if (has(INSTRUCTOR_ROLES)) return COURSE_ROLES.INSTRUCTOR;
  if (has(OBSERVER_ROLES)) return 'observer';
  if (has(LEARNER_ROLES)) return COURSE_ROLES.LEARNER;
  return null;
}

/** Role nền tảng cho dòng lms_user_mappings mới tạo từ danh sách lớp. */
export function platformRoleFor(role: CourseRole): PlatformRole {
  return role === COURSE_ROLES.INSTRUCTOR || role === COURSE_ROLES.TA
    ? COURSE_ROLES.INSTRUCTOR
    : COURSE_ROLES.LEARNER;
}
