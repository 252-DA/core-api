import { BadRequestException } from '@nestjs/common';
import {
  detectInvalidInputSqlState,
  getPrismaErrorModel,
} from './invalid-input-error';

/**
 * Fixture Dạng A: trích từ log thật khi Prisma ném P2007 với UUID sai định dạng.
 */
export function createInvalidUuidPrismaError(
  badValue = 'not-a-uuid',
  modelName = 'documents',
) {
  return Object.assign(
    new Error(
      `Invalid input value: invalid input syntax for type uuid: "${badValue}"`,
    ),
    {
      name: 'PrismaClientKnownRequestError',
      code: 'P2007',
      clientVersion: '7.8.0',
      meta: {
        modelName,
        driverAdapterError: {
          name: 'DriverAdapterError',
          cause: {
            originalCode: '22P02',
            originalMessage: `invalid input syntax for type uuid: "${badValue}"`,
            kind: 'InvalidInputValue',
            message: `invalid input syntax for type uuid: "${badValue}"`,
          },
        },
      },
    },
  );
}

/**
 * Fixture Dạng B: trích từ @prisma/adapter-pg (convertDriverError + onError)
 * và log thật khi chuỗi có byte 0x00 làm DriverAdapterError thoát thẳng ra ngoài.
 */
export function createInvalidByteDriverAdapterError() {
  return Object.assign(
    new Error('invalid byte sequence for encoding "UTF8": 0x00'),
    {
      name: 'DriverAdapterError',
      clientVersion: '7.8.0',
      cause: {
        originalCode: '22021',
        originalMessage: 'invalid byte sequence for encoding "UTF8": 0x00',
        kind: 'postgres',
        code: '22021',
        severity: 'ERROR',
        message: 'invalid byte sequence for encoding "UTF8": 0x00',
      },
    },
  );
}

describe('detectInvalidInputSqlState', () => {
  it('nhận diện Dạng A (PrismaClientKnownRequestError P2007 + 22P02)', () => {
    const err = createInvalidUuidPrismaError('not-a-uuid', 'course_memberships');
    expect(detectInvalidInputSqlState(err)).toBe('22P02');
    expect(getPrismaErrorModel(err)).toBe('course_memberships');
  });

  it('nhận diện Dạng B (DriverAdapterError trần với 22021)', () => {
    const err = createInvalidByteDriverAdapterError();
    expect(detectInvalidInputSqlState(err)).toBe('22021');
    expect(getPrismaErrorModel(err)).toBeUndefined();
  });

  it('trả null cho các lỗi ngoài phạm vi (P2002, P2007 mã khác, Error, HttpException, null)', () => {
    const p2002 = Object.assign(new Error('Unique constraint failed'), {
      name: 'PrismaClientKnownRequestError',
      code: 'P2002',
      meta: { modelName: 'documents', target: ['checksum'] },
    });
    expect(detectInvalidInputSqlState(p2002)).toBeNull();

    const p2007Other = Object.assign(new Error('Value out of range'), {
      name: 'PrismaClientKnownRequestError',
      code: 'P2007',
      meta: {
        modelName: 'documents',
        driverAdapterError: {
          name: 'DriverAdapterError',
          cause: {
            originalCode: '22003',
            originalMessage: 'value is out of range for type integer',
            kind: 'ValueOutOfRange',
          },
        },
      },
    });
    expect(detectInvalidInputSqlState(p2007Other)).toBeNull();

    const driverOther = Object.assign(new Error('Other driver error'), {
      name: 'DriverAdapterError',
      cause: {
        originalCode: '23505',
        kind: 'UniqueConstraintViolation',
      },
    });
    expect(detectInvalidInputSqlState(driverOther)).toBeNull();

    expect(detectInvalidInputSqlState(new Error('boom'))).toBeNull();
    expect(
      detectInvalidInputSqlState(new BadRequestException('bad')),
    ).toBeNull();
    expect(detectInvalidInputSqlState(null)).toBeNull();
    expect(detectInvalidInputSqlState(undefined)).toBeNull();
    expect(detectInvalidInputSqlState('22P02')).toBeNull();
  });
});
