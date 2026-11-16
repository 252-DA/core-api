import { courseRoleFromNrps, platformRoleFor } from './nrps-roles';

const M = 'http://purl.imsglobal.org/vocab/lis/v2/membership';

describe('courseRoleFromNrps', () => {
  it('trợ giảng Canvas gửi kèm Instructor nhưng vẫn là ta', () => {
    expect(
      courseRoleFromNrps([`${M}#Instructor`, `${M}/Instructor#TeachingAssistant`]),
    ).toBe('ta');
  });

  it.each([
    [[`${M}#Instructor`], 'instructor'],
    [[`${M}#ContentDeveloper`], 'instructor'],
    [[`${M}#Mentor`], 'observer'],
    [[`${M}#Learner`], 'learner'],
    [[`${M}#Member`], 'learner'],
  ])('%j -> %s', (roles, expected) => {
    expect(courseRoleFromNrps(roles)).toBe(expected);
  });

  it('giảng viên đồng thời là Member vẫn là instructor', () => {
    expect(courseRoleFromNrps([`${M}#Member`, `${M}#Instructor`])).toBe(
      'instructor',
    );
  });

  it('role lạ hoặc rỗng thì bỏ qua, kể cả URI chỉ chứa chữ "membership"', () => {
    expect(courseRoleFromNrps([])).toBeNull();
    expect(courseRoleFromNrps([`${M}#Administrator`])).toBeNull();
    expect(courseRoleFromNrps([`${M}#Learner/GuestLearner`])).toBeNull();
    expect(
      courseRoleFromNrps(['http://example.com/membership#Learner']),
    ).toBeNull();
  });

  it('role nền tảng: giảng viên và trợ giảng là instructor, còn lại learner', () => {
    expect(platformRoleFor('instructor')).toBe('instructor');
    expect(platformRoleFor('ta')).toBe('instructor');
    expect(platformRoleFor('learner')).toBe('learner');
    expect(platformRoleFor('observer')).toBe('learner');
  });
});
