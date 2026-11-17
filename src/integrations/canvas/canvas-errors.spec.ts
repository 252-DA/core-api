import { BadGatewayException } from '@nestjs/common';
import {
  CANVAS_TOKEN_INVALID_MESSAGE,
  CANVAS_UNREACHABLE_MESSAGE,
  CanvasApiError,
  describeCanvasError,
} from './canvas-errors';

describe('describeCanvasError', () => {
  it('maps HTTP 401 to the token message', () => {
    const error = new CanvasApiError(
      'Canvas trả HTTP 401 khi đọc module: {"errors":[]}',
      401,
    );
    expect(describeCanvasError(error)).toBe(CANVAS_TOKEN_INVALID_MESSAGE);
  });

  it.each([502, 503, 504])(
    'maps HTTP %i to the unreachable message',
    (status) => {
      const error = new CanvasApiError(
        `Canvas trả HTTP ${status} khi đọc module`,
        status,
      );
      expect(describeCanvasError(error)).toBe(CANVAS_UNREACHABLE_MESSAGE);
    },
  );

  it('maps connection failures (no HTTP status) to the unreachable message', () => {
    expect(
      describeCanvasError(
        new CanvasApiError(
          'Không kết nối được Canvas khi đọc module: fetch failed',
        ),
      ),
    ).toBe(CANVAS_UNREACHABLE_MESSAGE);
    expect(
      describeCanvasError(new Error('connect ECONNREFUSED 127.0.0.1:3000')),
    ).toBe(CANVAS_UNREACHABLE_MESSAGE);
  });

  it('reads the status from the message of errors that are not CanvasApiError', () => {
    expect(
      describeCanvasError(
        new BadGatewayException('Canvas trả HTTP 401 khi tải file'),
      ),
    ).toBe(CANVAS_TOKEN_INVALID_MESSAGE);
  });

  it('keeps the original message for anything else', () => {
    expect(
      describeCanvasError(
        new CanvasApiError('Canvas trả HTTP 404 khi đọc file', 404),
      ),
    ).toBe('Canvas trả HTTP 404 khi đọc file');
    expect(describeCanvasError(new Error('Course not linked'))).toBe(
      'Course not linked',
    );
    expect(describeCanvasError('plain')).toBe('plain');
  });
});
