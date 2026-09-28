/**
 * Vòng đời của `quiz_attempts.ags_status` — chính là hàng đợi bền vững cho
 * việc đẩy điểm về sổ điểm LMS:
 *
 *   NOT_REQUIRED  launch không gắn resource link / line item, không có gì để đẩy
 *   PENDING       chờ AgsPublisherService nhặt
 *   POSTING       một tiến trình đã giành lấy, đang gọi platform
 *   POSTED        LMS đã nhận điểm (ags_posted_at được ghi)
 *   FAILED        lỗi vĩnh viễn, hoặc đã hết số lần thử lại
 */
export const AGS_STATUS = {
  pending: 'PENDING',
  posting: 'POSTING',
  posted: 'POSTED',
  failed: 'FAILED',
  notRequired: 'NOT_REQUIRED',
} as const;

export type AgsStatus = (typeof AGS_STATUS)[keyof typeof AGS_STATUS];
