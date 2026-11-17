export const COURSE_ROLES = {
  INSTRUCTOR: 'instructor',
  TA: 'ta',
  LEARNER: 'learner',
} as const;

export const STAFF_ROLES: string[] = [
  COURSE_ROLES.INSTRUCTOR,
  COURSE_ROLES.TA,
];

export const LMS_ADMIN_ROLE = 'administrator';
