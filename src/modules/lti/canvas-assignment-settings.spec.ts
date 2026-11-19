import { assignmentSettingsFromClaims } from './canvas-assignment-settings';

describe('assignmentSettingsFromClaims', () => {
  const assignment = {
    canvas_assignment_id: '42',
    assignment_points: '10',
    assignment_due: '2026-12-01T16:59:00Z',
    assignment_unlock: '2026-11-20T00:00:00Z',
    assignment_lock: '2026-12-02T00:00:00Z',
    assignment_attempts: '2',
  };

  it('đọc đủ các biến của một Assignment', () => {
    expect(assignmentSettingsFromClaims(assignment)).toEqual({
      canvasAssignmentId: '42',
      pointsPossible: 10,
      dueAt: new Date('2026-12-01T16:59:00Z'),
      unlockAt: new Date('2026-11-20T00:00:00Z'),
      lockAt: new Date('2026-12-02T00:00:00Z'),
      allowedAttempts: 2,
    });
  });

  it('không phải launch từ Assignment thì trả null, không đụng cài đặt đã lưu', () => {
    expect(assignmentSettingsFromClaims(undefined)).toBeNull();
    expect(assignmentSettingsFromClaims({})).toBeNull();
    expect(
      assignmentSettingsFromClaims({
        ...assignment,
        canvas_assignment_id: '$Canvas.assignment.id',
      }),
    ).toBeNull();
    expect(
      assignmentSettingsFromClaims({
        ...assignment,
        canvas_assignment_id: '0',
      }),
    ).toBeNull();
    expect(
      assignmentSettingsFromClaims({
        ...assignment,
        canvas_assignment_id: 'abc',
      }),
    ).toBeNull();
  });

  it('biến Canvas để nguyên chuỗi là Assignment không đặt giá trị đó', () => {
    const settings = assignmentSettingsFromClaims({
      canvas_assignment_id: '42',
      assignment_points: '7.5',
      assignment_due: '$Canvas.assignment.dueAt.iso8601',
      assignment_unlock: '$Canvas.assignment.unlockAt.iso8601',
      assignment_lock: '',
      assignment_attempts: '$Canvas.assignment.allowedAttempts',
    });
    expect(settings).toEqual({
      canvasAssignmentId: '42',
      pointsPossible: 7.5,
      dueAt: null,
      unlockAt: null,
      lockAt: null,
      allowedAttempts: null,
    });
  });

  it.each([['-1'], ['0'], ['1.5'], ['abc'], ['']])(
    'số lần làm %p được hiểu là không giới hạn',
    (attempts) => {
      expect(
        assignmentSettingsFromClaims({
          ...assignment,
          assignment_attempts: attempts,
        })?.allowedAttempts,
      ).toBeNull();
    },
  );

  it('giới hạn số lần làm tối đa 1000', () => {
    expect(
      assignmentSettingsFromClaims({
        ...assignment,
        assignment_attempts: '5000',
      })?.allowedAttempts,
    ).toBe(1000);
  });

  it.each([
    ['0'],
    ['-3'],
    ['abc'],
    ['100000'],
    ['$Canvas.assignment.pointsPossible'],
  ])('điểm tối đa %p không dùng được thì bỏ qua', (points) => {
    expect(
      assignmentSettingsFromClaims({ ...assignment, assignment_points: points })
        ?.pointsPossible,
    ).toBeNull();
  });

  it('làm tròn điểm tối đa 2 chữ số và nhận số thập phân', () => {
    expect(
      assignmentSettingsFromClaims({
        ...assignment,
        assignment_points: '12.345',
      })?.pointsPossible,
    ).toBe(12.35);
  });

  it('ngày sai định dạng thì coi như không có', () => {
    expect(
      assignmentSettingsFromClaims({
        ...assignment,
        assignment_due: 'khong-phai-ngay',
      })?.dueAt,
    ).toBeNull();
  });

  it('nhận id và điểm gửi dạng số', () => {
    expect(
      assignmentSettingsFromClaims({
        canvas_assignment_id: 7,
        assignment_points: 100,
      }),
    ).toMatchObject({ canvasAssignmentId: '7', pointsPossible: 100 });
  });
});
