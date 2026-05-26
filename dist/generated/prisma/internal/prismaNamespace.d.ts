import * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../models.js";
import { type PrismaClient } from "./class.js";
export type * from '../models.js';
export type DMMF = typeof runtime.DMMF;
export type PrismaPromise<T> = runtime.Types.Public.PrismaPromise<T>;
export declare const PrismaClientKnownRequestError: typeof runtime.PrismaClientKnownRequestError;
export type PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
export declare const PrismaClientUnknownRequestError: typeof runtime.PrismaClientUnknownRequestError;
export type PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
export declare const PrismaClientRustPanicError: typeof runtime.PrismaClientRustPanicError;
export type PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
export declare const PrismaClientInitializationError: typeof runtime.PrismaClientInitializationError;
export type PrismaClientInitializationError = runtime.PrismaClientInitializationError;
export declare const PrismaClientValidationError: typeof runtime.PrismaClientValidationError;
export type PrismaClientValidationError = runtime.PrismaClientValidationError;
export declare const sql: typeof runtime.sqltag;
export declare const empty: runtime.Sql;
export declare const join: typeof runtime.join;
export declare const raw: typeof runtime.raw;
export declare const Sql: typeof runtime.Sql;
export type Sql = runtime.Sql;
export declare const Decimal: typeof runtime.Decimal;
export type Decimal = runtime.Decimal;
export type DecimalJsLike = runtime.DecimalJsLike;
export type Extension = runtime.Types.Extensions.UserArgs;
export declare const getExtensionContext: typeof runtime.Extensions.getExtensionContext;
export type Args<T, F extends runtime.Operation> = runtime.Types.Public.Args<T, F>;
export type Payload<T, F extends runtime.Operation = never> = runtime.Types.Public.Payload<T, F>;
export type Result<T, A, F extends runtime.Operation> = runtime.Types.Public.Result<T, A, F>;
export type Exact<A, W> = runtime.Types.Public.Exact<A, W>;
export type PrismaVersion = {
    client: string;
    engine: string;
};
export declare const prismaVersion: PrismaVersion;
export type Bytes = runtime.Bytes;
export type JsonObject = runtime.JsonObject;
export type JsonArray = runtime.JsonArray;
export type JsonValue = runtime.JsonValue;
export type InputJsonObject = runtime.InputJsonObject;
export type InputJsonArray = runtime.InputJsonArray;
export type InputJsonValue = runtime.InputJsonValue;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
export declare const DbNull: runtime.DbNullClass;
export declare const JsonNull: runtime.JsonNullClass;
export declare const AnyNull: runtime.AnyNullClass;
type SelectAndInclude = {
    select: any;
    include: any;
};
type SelectAndOmit = {
    select: any;
    omit: any;
};
type Prisma__Pick<T, K extends keyof T> = {
    [P in K]: T[P];
};
export type Enumerable<T> = T | Array<T>;
export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
};
export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
} & (T extends SelectAndInclude ? 'Please either choose `select` or `include`.' : T extends SelectAndOmit ? 'Please either choose `select` or `omit`.' : {});
export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
} & K;
type Without<T, U> = {
    [P in Exclude<keyof T, keyof U>]?: never;
};
export type XOR<T, U> = T extends object ? U extends object ? (Without<T, U> & U) | (Without<U, T> & T) : U : T;
type IsObject<T extends any> = T extends Array<any> ? False : T extends Date ? False : T extends Uint8Array ? False : T extends BigInt ? False : T extends object ? True : False;
export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T;
type __Either<O extends object, K extends Key> = Omit<O, K> & {
    [P in K]: Prisma__Pick<O, P & keyof O>;
}[K];
type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>;
type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>;
type _Either<O extends object, K extends Key, strict extends Boolean> = {
    1: EitherStrict<O, K>;
    0: EitherLoose<O, K>;
}[strict];
export type Either<O extends object, K extends Key, strict extends Boolean = 1> = O extends unknown ? _Either<O, K, strict> : never;
export type Union = any;
export type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K];
} & {};
export type IntersectOf<U extends Union> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
export type Overwrite<O extends object, O1 extends object> = {
    [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
} & {};
type _Merge<U extends object> = IntersectOf<Overwrite<U, {
    [K in keyof U]-?: At<U, K>;
}>>;
type Key = string | number | symbol;
type AtStrict<O extends object, K extends Key> = O[K & keyof O];
type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
    1: AtStrict<O, K>;
    0: AtLoose<O, K>;
}[strict];
export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
} & {};
export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
} & {};
type _Record<K extends keyof any, T> = {
    [P in K]: T;
};
type NoExpand<T> = T extends unknown ? T : never;
export type AtLeast<O extends object, K extends string> = NoExpand<O extends unknown ? (K extends keyof O ? {
    [P in K]: O[P];
} & O : O) | {
    [P in keyof O as P extends K ? P : never]-?: O[P];
} & O : never>;
type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;
export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;
export type Boolean = True | False;
export type True = 1;
export type False = 0;
export type Not<B extends Boolean> = {
    0: 1;
    1: 0;
}[B];
export type Extends<A1 extends any, A2 extends any> = [A1] extends [never] ? 0 : A1 extends A2 ? 1 : 0;
export type Has<U extends Union, U1 extends Union> = Not<Extends<Exclude<U1, U>, U1>>;
export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
        0: 0;
        1: 1;
    };
    1: {
        0: 1;
        1: 1;
    };
}[B1][B2];
export type Keys<U extends Union> = U extends unknown ? keyof U : never;
export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O ? O[P] : never;
} : never;
type FieldPaths<T, U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>> = IsObject<T> extends True ? U : T;
export type GetHavingFields<T> = {
    [K in keyof T]: Or<Or<Extends<'OR', K>, Extends<'AND', K>>, Extends<'NOT', K>> extends True ? T[K] extends infer TK ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never> : never : {} extends FieldPaths<T[K]> ? never : K;
}[keyof T];
type _TupleToUnion<T> = T extends (infer E)[] ? E : never;
type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>;
export type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T;
export type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>;
export type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T;
export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>;
type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>;
export declare const ModelName: {
    readonly assessments: "assessments";
    readonly chapters: "chapters";
    readonly chunk_concepts: "chunk_concepts";
    readonly chunk_contents: "chunk_contents";
    readonly chunk_lo_mappings: "chunk_lo_mappings";
    readonly chunks_metadata: "chunks_metadata";
    readonly concepts: "concepts";
    readonly courses: "courses";
    readonly documents_metadata: "documents_metadata";
    readonly learning_outcomes: "learning_outcomes";
    readonly lesson_cards: "lesson_cards";
    readonly lms_course_ref: "lms_course_ref";
    readonly lms_user_mappings: "lms_user_mappings";
    readonly lo_assessments: "lo_assessments";
    readonly outbox_events: "outbox_events";
    readonly quiz_items: "quiz_items";
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export interface TypeMapCb<GlobalOmitOptions = {}> extends runtime.Types.Utils.Fn<{
    extArgs: runtime.Types.Extensions.InternalArgs;
}, runtime.Types.Utils.Record<string, any>> {
    returns: TypeMap<this['params']['extArgs'], GlobalOmitOptions>;
}
export type TypeMap<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
        omit: GlobalOmitOptions;
    };
    meta: {
        modelProps: "assessments" | "chapters" | "chunk_concepts" | "chunk_contents" | "chunk_lo_mappings" | "chunks_metadata" | "concepts" | "courses" | "documents_metadata" | "learning_outcomes" | "lesson_cards" | "lms_course_ref" | "lms_user_mappings" | "lo_assessments" | "outbox_events" | "quiz_items";
        txIsolationLevel: TransactionIsolationLevel;
    };
    model: {
        assessments: {
            payload: Prisma.$assessmentsPayload<ExtArgs>;
            fields: Prisma.assessmentsFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.assessmentsFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$assessmentsPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.assessmentsFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$assessmentsPayload>;
                };
                findFirst: {
                    args: Prisma.assessmentsFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$assessmentsPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.assessmentsFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$assessmentsPayload>;
                };
                findMany: {
                    args: Prisma.assessmentsFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$assessmentsPayload>[];
                };
                create: {
                    args: Prisma.assessmentsCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$assessmentsPayload>;
                };
                createMany: {
                    args: Prisma.assessmentsCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.assessmentsCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$assessmentsPayload>[];
                };
                delete: {
                    args: Prisma.assessmentsDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$assessmentsPayload>;
                };
                update: {
                    args: Prisma.assessmentsUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$assessmentsPayload>;
                };
                deleteMany: {
                    args: Prisma.assessmentsDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.assessmentsUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.assessmentsUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$assessmentsPayload>[];
                };
                upsert: {
                    args: Prisma.assessmentsUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$assessmentsPayload>;
                };
                aggregate: {
                    args: Prisma.AssessmentsAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateAssessments>;
                };
                groupBy: {
                    args: Prisma.assessmentsGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AssessmentsGroupByOutputType>[];
                };
                count: {
                    args: Prisma.assessmentsCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AssessmentsCountAggregateOutputType> | number;
                };
            };
        };
        chapters: {
            payload: Prisma.$chaptersPayload<ExtArgs>;
            fields: Prisma.chaptersFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.chaptersFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chaptersPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.chaptersFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chaptersPayload>;
                };
                findFirst: {
                    args: Prisma.chaptersFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chaptersPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.chaptersFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chaptersPayload>;
                };
                findMany: {
                    args: Prisma.chaptersFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chaptersPayload>[];
                };
                create: {
                    args: Prisma.chaptersCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chaptersPayload>;
                };
                createMany: {
                    args: Prisma.chaptersCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.chaptersCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chaptersPayload>[];
                };
                delete: {
                    args: Prisma.chaptersDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chaptersPayload>;
                };
                update: {
                    args: Prisma.chaptersUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chaptersPayload>;
                };
                deleteMany: {
                    args: Prisma.chaptersDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.chaptersUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.chaptersUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chaptersPayload>[];
                };
                upsert: {
                    args: Prisma.chaptersUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chaptersPayload>;
                };
                aggregate: {
                    args: Prisma.ChaptersAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateChapters>;
                };
                groupBy: {
                    args: Prisma.chaptersGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ChaptersGroupByOutputType>[];
                };
                count: {
                    args: Prisma.chaptersCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ChaptersCountAggregateOutputType> | number;
                };
            };
        };
        chunk_concepts: {
            payload: Prisma.$chunk_conceptsPayload<ExtArgs>;
            fields: Prisma.chunk_conceptsFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.chunk_conceptsFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_conceptsPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.chunk_conceptsFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_conceptsPayload>;
                };
                findFirst: {
                    args: Prisma.chunk_conceptsFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_conceptsPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.chunk_conceptsFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_conceptsPayload>;
                };
                findMany: {
                    args: Prisma.chunk_conceptsFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_conceptsPayload>[];
                };
                create: {
                    args: Prisma.chunk_conceptsCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_conceptsPayload>;
                };
                createMany: {
                    args: Prisma.chunk_conceptsCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.chunk_conceptsCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_conceptsPayload>[];
                };
                delete: {
                    args: Prisma.chunk_conceptsDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_conceptsPayload>;
                };
                update: {
                    args: Prisma.chunk_conceptsUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_conceptsPayload>;
                };
                deleteMany: {
                    args: Prisma.chunk_conceptsDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.chunk_conceptsUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.chunk_conceptsUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_conceptsPayload>[];
                };
                upsert: {
                    args: Prisma.chunk_conceptsUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_conceptsPayload>;
                };
                aggregate: {
                    args: Prisma.Chunk_conceptsAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateChunk_concepts>;
                };
                groupBy: {
                    args: Prisma.chunk_conceptsGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Chunk_conceptsGroupByOutputType>[];
                };
                count: {
                    args: Prisma.chunk_conceptsCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Chunk_conceptsCountAggregateOutputType> | number;
                };
            };
        };
        chunk_contents: {
            payload: Prisma.$chunk_contentsPayload<ExtArgs>;
            fields: Prisma.chunk_contentsFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.chunk_contentsFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_contentsPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.chunk_contentsFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_contentsPayload>;
                };
                findFirst: {
                    args: Prisma.chunk_contentsFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_contentsPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.chunk_contentsFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_contentsPayload>;
                };
                findMany: {
                    args: Prisma.chunk_contentsFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_contentsPayload>[];
                };
                create: {
                    args: Prisma.chunk_contentsCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_contentsPayload>;
                };
                createMany: {
                    args: Prisma.chunk_contentsCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.chunk_contentsCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_contentsPayload>[];
                };
                delete: {
                    args: Prisma.chunk_contentsDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_contentsPayload>;
                };
                update: {
                    args: Prisma.chunk_contentsUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_contentsPayload>;
                };
                deleteMany: {
                    args: Prisma.chunk_contentsDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.chunk_contentsUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.chunk_contentsUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_contentsPayload>[];
                };
                upsert: {
                    args: Prisma.chunk_contentsUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_contentsPayload>;
                };
                aggregate: {
                    args: Prisma.Chunk_contentsAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateChunk_contents>;
                };
                groupBy: {
                    args: Prisma.chunk_contentsGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Chunk_contentsGroupByOutputType>[];
                };
                count: {
                    args: Prisma.chunk_contentsCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Chunk_contentsCountAggregateOutputType> | number;
                };
            };
        };
        chunk_lo_mappings: {
            payload: Prisma.$chunk_lo_mappingsPayload<ExtArgs>;
            fields: Prisma.chunk_lo_mappingsFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.chunk_lo_mappingsFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_lo_mappingsPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.chunk_lo_mappingsFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_lo_mappingsPayload>;
                };
                findFirst: {
                    args: Prisma.chunk_lo_mappingsFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_lo_mappingsPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.chunk_lo_mappingsFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_lo_mappingsPayload>;
                };
                findMany: {
                    args: Prisma.chunk_lo_mappingsFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_lo_mappingsPayload>[];
                };
                create: {
                    args: Prisma.chunk_lo_mappingsCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_lo_mappingsPayload>;
                };
                createMany: {
                    args: Prisma.chunk_lo_mappingsCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.chunk_lo_mappingsCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_lo_mappingsPayload>[];
                };
                delete: {
                    args: Prisma.chunk_lo_mappingsDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_lo_mappingsPayload>;
                };
                update: {
                    args: Prisma.chunk_lo_mappingsUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_lo_mappingsPayload>;
                };
                deleteMany: {
                    args: Prisma.chunk_lo_mappingsDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.chunk_lo_mappingsUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.chunk_lo_mappingsUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_lo_mappingsPayload>[];
                };
                upsert: {
                    args: Prisma.chunk_lo_mappingsUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunk_lo_mappingsPayload>;
                };
                aggregate: {
                    args: Prisma.Chunk_lo_mappingsAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateChunk_lo_mappings>;
                };
                groupBy: {
                    args: Prisma.chunk_lo_mappingsGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Chunk_lo_mappingsGroupByOutputType>[];
                };
                count: {
                    args: Prisma.chunk_lo_mappingsCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Chunk_lo_mappingsCountAggregateOutputType> | number;
                };
            };
        };
        chunks_metadata: {
            payload: Prisma.$chunks_metadataPayload<ExtArgs>;
            fields: Prisma.chunks_metadataFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.chunks_metadataFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunks_metadataPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.chunks_metadataFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunks_metadataPayload>;
                };
                findFirst: {
                    args: Prisma.chunks_metadataFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunks_metadataPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.chunks_metadataFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunks_metadataPayload>;
                };
                findMany: {
                    args: Prisma.chunks_metadataFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunks_metadataPayload>[];
                };
                create: {
                    args: Prisma.chunks_metadataCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunks_metadataPayload>;
                };
                createMany: {
                    args: Prisma.chunks_metadataCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.chunks_metadataCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunks_metadataPayload>[];
                };
                delete: {
                    args: Prisma.chunks_metadataDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunks_metadataPayload>;
                };
                update: {
                    args: Prisma.chunks_metadataUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunks_metadataPayload>;
                };
                deleteMany: {
                    args: Prisma.chunks_metadataDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.chunks_metadataUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.chunks_metadataUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunks_metadataPayload>[];
                };
                upsert: {
                    args: Prisma.chunks_metadataUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$chunks_metadataPayload>;
                };
                aggregate: {
                    args: Prisma.Chunks_metadataAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateChunks_metadata>;
                };
                groupBy: {
                    args: Prisma.chunks_metadataGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Chunks_metadataGroupByOutputType>[];
                };
                count: {
                    args: Prisma.chunks_metadataCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Chunks_metadataCountAggregateOutputType> | number;
                };
            };
        };
        concepts: {
            payload: Prisma.$conceptsPayload<ExtArgs>;
            fields: Prisma.conceptsFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.conceptsFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$conceptsPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.conceptsFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$conceptsPayload>;
                };
                findFirst: {
                    args: Prisma.conceptsFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$conceptsPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.conceptsFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$conceptsPayload>;
                };
                findMany: {
                    args: Prisma.conceptsFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$conceptsPayload>[];
                };
                create: {
                    args: Prisma.conceptsCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$conceptsPayload>;
                };
                createMany: {
                    args: Prisma.conceptsCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.conceptsCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$conceptsPayload>[];
                };
                delete: {
                    args: Prisma.conceptsDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$conceptsPayload>;
                };
                update: {
                    args: Prisma.conceptsUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$conceptsPayload>;
                };
                deleteMany: {
                    args: Prisma.conceptsDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.conceptsUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.conceptsUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$conceptsPayload>[];
                };
                upsert: {
                    args: Prisma.conceptsUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$conceptsPayload>;
                };
                aggregate: {
                    args: Prisma.ConceptsAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateConcepts>;
                };
                groupBy: {
                    args: Prisma.conceptsGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ConceptsGroupByOutputType>[];
                };
                count: {
                    args: Prisma.conceptsCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.ConceptsCountAggregateOutputType> | number;
                };
            };
        };
        courses: {
            payload: Prisma.$coursesPayload<ExtArgs>;
            fields: Prisma.coursesFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.coursesFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$coursesPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.coursesFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$coursesPayload>;
                };
                findFirst: {
                    args: Prisma.coursesFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$coursesPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.coursesFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$coursesPayload>;
                };
                findMany: {
                    args: Prisma.coursesFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$coursesPayload>[];
                };
                create: {
                    args: Prisma.coursesCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$coursesPayload>;
                };
                createMany: {
                    args: Prisma.coursesCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.coursesCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$coursesPayload>[];
                };
                delete: {
                    args: Prisma.coursesDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$coursesPayload>;
                };
                update: {
                    args: Prisma.coursesUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$coursesPayload>;
                };
                deleteMany: {
                    args: Prisma.coursesDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.coursesUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.coursesUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$coursesPayload>[];
                };
                upsert: {
                    args: Prisma.coursesUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$coursesPayload>;
                };
                aggregate: {
                    args: Prisma.CoursesAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateCourses>;
                };
                groupBy: {
                    args: Prisma.coursesGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.CoursesGroupByOutputType>[];
                };
                count: {
                    args: Prisma.coursesCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.CoursesCountAggregateOutputType> | number;
                };
            };
        };
        documents_metadata: {
            payload: Prisma.$documents_metadataPayload<ExtArgs>;
            fields: Prisma.documents_metadataFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.documents_metadataFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$documents_metadataPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.documents_metadataFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$documents_metadataPayload>;
                };
                findFirst: {
                    args: Prisma.documents_metadataFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$documents_metadataPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.documents_metadataFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$documents_metadataPayload>;
                };
                findMany: {
                    args: Prisma.documents_metadataFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$documents_metadataPayload>[];
                };
                create: {
                    args: Prisma.documents_metadataCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$documents_metadataPayload>;
                };
                createMany: {
                    args: Prisma.documents_metadataCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.documents_metadataCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$documents_metadataPayload>[];
                };
                delete: {
                    args: Prisma.documents_metadataDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$documents_metadataPayload>;
                };
                update: {
                    args: Prisma.documents_metadataUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$documents_metadataPayload>;
                };
                deleteMany: {
                    args: Prisma.documents_metadataDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.documents_metadataUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.documents_metadataUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$documents_metadataPayload>[];
                };
                upsert: {
                    args: Prisma.documents_metadataUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$documents_metadataPayload>;
                };
                aggregate: {
                    args: Prisma.Documents_metadataAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateDocuments_metadata>;
                };
                groupBy: {
                    args: Prisma.documents_metadataGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Documents_metadataGroupByOutputType>[];
                };
                count: {
                    args: Prisma.documents_metadataCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Documents_metadataCountAggregateOutputType> | number;
                };
            };
        };
        learning_outcomes: {
            payload: Prisma.$learning_outcomesPayload<ExtArgs>;
            fields: Prisma.learning_outcomesFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.learning_outcomesFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$learning_outcomesPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.learning_outcomesFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$learning_outcomesPayload>;
                };
                findFirst: {
                    args: Prisma.learning_outcomesFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$learning_outcomesPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.learning_outcomesFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$learning_outcomesPayload>;
                };
                findMany: {
                    args: Prisma.learning_outcomesFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$learning_outcomesPayload>[];
                };
                create: {
                    args: Prisma.learning_outcomesCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$learning_outcomesPayload>;
                };
                createMany: {
                    args: Prisma.learning_outcomesCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.learning_outcomesCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$learning_outcomesPayload>[];
                };
                delete: {
                    args: Prisma.learning_outcomesDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$learning_outcomesPayload>;
                };
                update: {
                    args: Prisma.learning_outcomesUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$learning_outcomesPayload>;
                };
                deleteMany: {
                    args: Prisma.learning_outcomesDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.learning_outcomesUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.learning_outcomesUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$learning_outcomesPayload>[];
                };
                upsert: {
                    args: Prisma.learning_outcomesUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$learning_outcomesPayload>;
                };
                aggregate: {
                    args: Prisma.Learning_outcomesAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateLearning_outcomes>;
                };
                groupBy: {
                    args: Prisma.learning_outcomesGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Learning_outcomesGroupByOutputType>[];
                };
                count: {
                    args: Prisma.learning_outcomesCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Learning_outcomesCountAggregateOutputType> | number;
                };
            };
        };
        lesson_cards: {
            payload: Prisma.$lesson_cardsPayload<ExtArgs>;
            fields: Prisma.lesson_cardsFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.lesson_cardsFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lesson_cardsPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.lesson_cardsFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lesson_cardsPayload>;
                };
                findFirst: {
                    args: Prisma.lesson_cardsFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lesson_cardsPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.lesson_cardsFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lesson_cardsPayload>;
                };
                findMany: {
                    args: Prisma.lesson_cardsFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lesson_cardsPayload>[];
                };
                create: {
                    args: Prisma.lesson_cardsCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lesson_cardsPayload>;
                };
                createMany: {
                    args: Prisma.lesson_cardsCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.lesson_cardsCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lesson_cardsPayload>[];
                };
                delete: {
                    args: Prisma.lesson_cardsDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lesson_cardsPayload>;
                };
                update: {
                    args: Prisma.lesson_cardsUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lesson_cardsPayload>;
                };
                deleteMany: {
                    args: Prisma.lesson_cardsDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.lesson_cardsUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.lesson_cardsUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lesson_cardsPayload>[];
                };
                upsert: {
                    args: Prisma.lesson_cardsUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lesson_cardsPayload>;
                };
                aggregate: {
                    args: Prisma.Lesson_cardsAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateLesson_cards>;
                };
                groupBy: {
                    args: Prisma.lesson_cardsGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Lesson_cardsGroupByOutputType>[];
                };
                count: {
                    args: Prisma.lesson_cardsCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Lesson_cardsCountAggregateOutputType> | number;
                };
            };
        };
        lms_course_ref: {
            payload: Prisma.$lms_course_refPayload<ExtArgs>;
            fields: Prisma.lms_course_refFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.lms_course_refFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_course_refPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.lms_course_refFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_course_refPayload>;
                };
                findFirst: {
                    args: Prisma.lms_course_refFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_course_refPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.lms_course_refFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_course_refPayload>;
                };
                findMany: {
                    args: Prisma.lms_course_refFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_course_refPayload>[];
                };
                create: {
                    args: Prisma.lms_course_refCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_course_refPayload>;
                };
                createMany: {
                    args: Prisma.lms_course_refCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.lms_course_refCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_course_refPayload>[];
                };
                delete: {
                    args: Prisma.lms_course_refDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_course_refPayload>;
                };
                update: {
                    args: Prisma.lms_course_refUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_course_refPayload>;
                };
                deleteMany: {
                    args: Prisma.lms_course_refDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.lms_course_refUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.lms_course_refUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_course_refPayload>[];
                };
                upsert: {
                    args: Prisma.lms_course_refUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_course_refPayload>;
                };
                aggregate: {
                    args: Prisma.Lms_course_refAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateLms_course_ref>;
                };
                groupBy: {
                    args: Prisma.lms_course_refGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Lms_course_refGroupByOutputType>[];
                };
                count: {
                    args: Prisma.lms_course_refCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Lms_course_refCountAggregateOutputType> | number;
                };
            };
        };
        lms_user_mappings: {
            payload: Prisma.$lms_user_mappingsPayload<ExtArgs>;
            fields: Prisma.lms_user_mappingsFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.lms_user_mappingsFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_user_mappingsPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.lms_user_mappingsFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_user_mappingsPayload>;
                };
                findFirst: {
                    args: Prisma.lms_user_mappingsFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_user_mappingsPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.lms_user_mappingsFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_user_mappingsPayload>;
                };
                findMany: {
                    args: Prisma.lms_user_mappingsFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_user_mappingsPayload>[];
                };
                create: {
                    args: Prisma.lms_user_mappingsCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_user_mappingsPayload>;
                };
                createMany: {
                    args: Prisma.lms_user_mappingsCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.lms_user_mappingsCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_user_mappingsPayload>[];
                };
                delete: {
                    args: Prisma.lms_user_mappingsDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_user_mappingsPayload>;
                };
                update: {
                    args: Prisma.lms_user_mappingsUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_user_mappingsPayload>;
                };
                deleteMany: {
                    args: Prisma.lms_user_mappingsDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.lms_user_mappingsUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.lms_user_mappingsUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_user_mappingsPayload>[];
                };
                upsert: {
                    args: Prisma.lms_user_mappingsUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lms_user_mappingsPayload>;
                };
                aggregate: {
                    args: Prisma.Lms_user_mappingsAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateLms_user_mappings>;
                };
                groupBy: {
                    args: Prisma.lms_user_mappingsGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Lms_user_mappingsGroupByOutputType>[];
                };
                count: {
                    args: Prisma.lms_user_mappingsCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Lms_user_mappingsCountAggregateOutputType> | number;
                };
            };
        };
        lo_assessments: {
            payload: Prisma.$lo_assessmentsPayload<ExtArgs>;
            fields: Prisma.lo_assessmentsFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.lo_assessmentsFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lo_assessmentsPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.lo_assessmentsFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lo_assessmentsPayload>;
                };
                findFirst: {
                    args: Prisma.lo_assessmentsFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lo_assessmentsPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.lo_assessmentsFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lo_assessmentsPayload>;
                };
                findMany: {
                    args: Prisma.lo_assessmentsFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lo_assessmentsPayload>[];
                };
                create: {
                    args: Prisma.lo_assessmentsCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lo_assessmentsPayload>;
                };
                createMany: {
                    args: Prisma.lo_assessmentsCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.lo_assessmentsCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lo_assessmentsPayload>[];
                };
                delete: {
                    args: Prisma.lo_assessmentsDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lo_assessmentsPayload>;
                };
                update: {
                    args: Prisma.lo_assessmentsUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lo_assessmentsPayload>;
                };
                deleteMany: {
                    args: Prisma.lo_assessmentsDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.lo_assessmentsUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.lo_assessmentsUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lo_assessmentsPayload>[];
                };
                upsert: {
                    args: Prisma.lo_assessmentsUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$lo_assessmentsPayload>;
                };
                aggregate: {
                    args: Prisma.Lo_assessmentsAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateLo_assessments>;
                };
                groupBy: {
                    args: Prisma.lo_assessmentsGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Lo_assessmentsGroupByOutputType>[];
                };
                count: {
                    args: Prisma.lo_assessmentsCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Lo_assessmentsCountAggregateOutputType> | number;
                };
            };
        };
        outbox_events: {
            payload: Prisma.$outbox_eventsPayload<ExtArgs>;
            fields: Prisma.outbox_eventsFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.outbox_eventsFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$outbox_eventsPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.outbox_eventsFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$outbox_eventsPayload>;
                };
                findFirst: {
                    args: Prisma.outbox_eventsFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$outbox_eventsPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.outbox_eventsFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$outbox_eventsPayload>;
                };
                findMany: {
                    args: Prisma.outbox_eventsFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$outbox_eventsPayload>[];
                };
                create: {
                    args: Prisma.outbox_eventsCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$outbox_eventsPayload>;
                };
                createMany: {
                    args: Prisma.outbox_eventsCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.outbox_eventsCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$outbox_eventsPayload>[];
                };
                delete: {
                    args: Prisma.outbox_eventsDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$outbox_eventsPayload>;
                };
                update: {
                    args: Prisma.outbox_eventsUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$outbox_eventsPayload>;
                };
                deleteMany: {
                    args: Prisma.outbox_eventsDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.outbox_eventsUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.outbox_eventsUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$outbox_eventsPayload>[];
                };
                upsert: {
                    args: Prisma.outbox_eventsUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$outbox_eventsPayload>;
                };
                aggregate: {
                    args: Prisma.Outbox_eventsAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateOutbox_events>;
                };
                groupBy: {
                    args: Prisma.outbox_eventsGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Outbox_eventsGroupByOutputType>[];
                };
                count: {
                    args: Prisma.outbox_eventsCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Outbox_eventsCountAggregateOutputType> | number;
                };
            };
        };
        quiz_items: {
            payload: Prisma.$quiz_itemsPayload<ExtArgs>;
            fields: Prisma.quiz_itemsFieldRefs;
            operations: {
                findUnique: {
                    args: Prisma.quiz_itemsFindUniqueArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$quiz_itemsPayload> | null;
                };
                findUniqueOrThrow: {
                    args: Prisma.quiz_itemsFindUniqueOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$quiz_itemsPayload>;
                };
                findFirst: {
                    args: Prisma.quiz_itemsFindFirstArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$quiz_itemsPayload> | null;
                };
                findFirstOrThrow: {
                    args: Prisma.quiz_itemsFindFirstOrThrowArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$quiz_itemsPayload>;
                };
                findMany: {
                    args: Prisma.quiz_itemsFindManyArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$quiz_itemsPayload>[];
                };
                create: {
                    args: Prisma.quiz_itemsCreateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$quiz_itemsPayload>;
                };
                createMany: {
                    args: Prisma.quiz_itemsCreateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                createManyAndReturn: {
                    args: Prisma.quiz_itemsCreateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$quiz_itemsPayload>[];
                };
                delete: {
                    args: Prisma.quiz_itemsDeleteArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$quiz_itemsPayload>;
                };
                update: {
                    args: Prisma.quiz_itemsUpdateArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$quiz_itemsPayload>;
                };
                deleteMany: {
                    args: Prisma.quiz_itemsDeleteManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateMany: {
                    args: Prisma.quiz_itemsUpdateManyArgs<ExtArgs>;
                    result: BatchPayload;
                };
                updateManyAndReturn: {
                    args: Prisma.quiz_itemsUpdateManyAndReturnArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$quiz_itemsPayload>[];
                };
                upsert: {
                    args: Prisma.quiz_itemsUpsertArgs<ExtArgs>;
                    result: runtime.Types.Utils.PayloadToResult<Prisma.$quiz_itemsPayload>;
                };
                aggregate: {
                    args: Prisma.Quiz_itemsAggregateArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.AggregateQuiz_items>;
                };
                groupBy: {
                    args: Prisma.quiz_itemsGroupByArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Quiz_itemsGroupByOutputType>[];
                };
                count: {
                    args: Prisma.quiz_itemsCountArgs<ExtArgs>;
                    result: runtime.Types.Utils.Optional<Prisma.Quiz_itemsCountAggregateOutputType> | number;
                };
            };
        };
    };
} & {
    other: {
        payload: any;
        operations: {
            $executeRaw: {
                args: [query: TemplateStringsArray | Sql, ...values: any[]];
                result: any;
            };
            $executeRawUnsafe: {
                args: [query: string, ...values: any[]];
                result: any;
            };
            $queryRaw: {
                args: [query: TemplateStringsArray | Sql, ...values: any[]];
                result: any;
            };
            $queryRawUnsafe: {
                args: [query: string, ...values: any[]];
                result: any;
            };
        };
    };
};
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: "ReadUncommitted";
    readonly ReadCommitted: "ReadCommitted";
    readonly RepeatableRead: "RepeatableRead";
    readonly Serializable: "Serializable";
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const AssessmentsScalarFieldEnum: {
    readonly assessment_id: "assessment_id";
    readonly course_id: "course_id";
    readonly code: "code";
    readonly name_vi: "name_vi";
    readonly name_en: "name_en";
    readonly category: "category";
    readonly weight: "weight";
};
export type AssessmentsScalarFieldEnum = (typeof AssessmentsScalarFieldEnum)[keyof typeof AssessmentsScalarFieldEnum];
export declare const ChaptersScalarFieldEnum: {
    readonly chapter_id: "chapter_id";
    readonly course_id: "course_id";
    readonly code: "code";
    readonly title: "title";
    readonly order_index: "order_index";
};
export type ChaptersScalarFieldEnum = (typeof ChaptersScalarFieldEnum)[keyof typeof ChaptersScalarFieldEnum];
export declare const Chunk_conceptsScalarFieldEnum: {
    readonly chunk_id: "chunk_id";
    readonly concept_id: "concept_id";
    readonly confidence: "confidence";
    readonly source: "source";
    readonly created_at: "created_at";
    readonly updated_at: "updated_at";
};
export type Chunk_conceptsScalarFieldEnum = (typeof Chunk_conceptsScalarFieldEnum)[keyof typeof Chunk_conceptsScalarFieldEnum];
export declare const Chunk_contentsScalarFieldEnum: {
    readonly chunk_id: "chunk_id";
    readonly document_id: "document_id";
    readonly content_text: "content_text";
    readonly embedding_input: "embedding_input";
    readonly updated_at: "updated_at";
};
export type Chunk_contentsScalarFieldEnum = (typeof Chunk_contentsScalarFieldEnum)[keyof typeof Chunk_contentsScalarFieldEnum];
export declare const Chunk_lo_mappingsScalarFieldEnum: {
    readonly chunk_id: "chunk_id";
    readonly lo_id: "lo_id";
    readonly confidence: "confidence";
    readonly source: "source";
    readonly created_at: "created_at";
};
export type Chunk_lo_mappingsScalarFieldEnum = (typeof Chunk_lo_mappingsScalarFieldEnum)[keyof typeof Chunk_lo_mappingsScalarFieldEnum];
export declare const Chunks_metadataScalarFieldEnum: {
    readonly chunk_id: "chunk_id";
    readonly document_id: "document_id";
    readonly chunk_index: "chunk_index";
    readonly heading_path: "heading_path";
    readonly heading_level: "heading_level";
    readonly page_number: "page_number";
    readonly content_length: "content_length";
    readonly language: "language";
    readonly created_at: "created_at";
    readonly updated_at: "updated_at";
};
export type Chunks_metadataScalarFieldEnum = (typeof Chunks_metadataScalarFieldEnum)[keyof typeof Chunks_metadataScalarFieldEnum];
export declare const ConceptsScalarFieldEnum: {
    readonly id: "id";
    readonly name: "name";
    readonly canonical_name: "canonical_name";
    readonly slug: "slug";
    readonly domain: "domain";
    readonly category: "category";
    readonly language: "language";
    readonly created_at: "created_at";
    readonly updated_at: "updated_at";
};
export type ConceptsScalarFieldEnum = (typeof ConceptsScalarFieldEnum)[keyof typeof ConceptsScalarFieldEnum];
export declare const CoursesScalarFieldEnum: {
    readonly course_id: "course_id";
    readonly code: "code";
    readonly title_vi: "title_vi";
    readonly title_en: "title_en";
    readonly credits: "credits";
    readonly semester: "semester";
    readonly source_document_id: "source_document_id";
    readonly extraction_confidence: "extraction_confidence";
    readonly created_at: "created_at";
    readonly updated_at: "updated_at";
};
export type CoursesScalarFieldEnum = (typeof CoursesScalarFieldEnum)[keyof typeof CoursesScalarFieldEnum];
export declare const Documents_metadataScalarFieldEnum: {
    readonly document_id: "document_id";
    readonly document_name: "document_name";
    readonly doc_type: "doc_type";
    readonly mime_type: "mime_type";
    readonly size_bytes: "size_bytes";
    readonly storage_key: "storage_key";
    readonly course_id: "course_id";
    readonly owner_id: "owner_id";
    readonly language: "language";
    readonly status: "status";
    readonly error_msg: "error_msg";
    readonly metadata_json: "metadata_json";
    readonly created_at: "created_at";
    readonly updated_at: "updated_at";
};
export type Documents_metadataScalarFieldEnum = (typeof Documents_metadataScalarFieldEnum)[keyof typeof Documents_metadataScalarFieldEnum];
export declare const Learning_outcomesScalarFieldEnum: {
    readonly lo_id: "lo_id";
    readonly course_id: "course_id";
    readonly code: "code";
    readonly parent_code: "parent_code";
    readonly statement_vi: "statement_vi";
    readonly statement_en: "statement_en";
    readonly bloom_level: "bloom_level";
    readonly cdio_level: "cdio_level";
};
export type Learning_outcomesScalarFieldEnum = (typeof Learning_outcomesScalarFieldEnum)[keyof typeof Learning_outcomesScalarFieldEnum];
export declare const Lesson_cardsScalarFieldEnum: {
    readonly id: "id";
    readonly document_id: "document_id";
    readonly primary_chunk_id: "primary_chunk_id";
    readonly source_chunk_ids: "source_chunk_ids";
    readonly heading_path: "heading_path";
    readonly title: "title";
    readonly bullets: "bullets";
    readonly key_insight: "key_insight";
    readonly card_index: "card_index";
    readonly model_id: "model_id";
    readonly created_at: "created_at";
};
export type Lesson_cardsScalarFieldEnum = (typeof Lesson_cardsScalarFieldEnum)[keyof typeof Lesson_cardsScalarFieldEnum];
export declare const Lms_course_refScalarFieldEnum: {
    readonly id: "id";
    readonly lms_type: "lms_type";
    readonly lms_course_id: "lms_course_id";
    readonly course_id: "course_id";
    readonly created_at: "created_at";
};
export type Lms_course_refScalarFieldEnum = (typeof Lms_course_refScalarFieldEnum)[keyof typeof Lms_course_refScalarFieldEnum];
export declare const Lms_user_mappingsScalarFieldEnum: {
    readonly id: "id";
    readonly lms_type: "lms_type";
    readonly lms_user_id: "lms_user_id";
    readonly internal_user_id: "internal_user_id";
    readonly email: "email";
    readonly display_name: "display_name";
    readonly created_at: "created_at";
    readonly updated_at: "updated_at";
};
export type Lms_user_mappingsScalarFieldEnum = (typeof Lms_user_mappingsScalarFieldEnum)[keyof typeof Lms_user_mappingsScalarFieldEnum];
export declare const Lo_assessmentsScalarFieldEnum: {
    readonly lo_id: "lo_id";
    readonly assessment_id: "assessment_id";
};
export type Lo_assessmentsScalarFieldEnum = (typeof Lo_assessmentsScalarFieldEnum)[keyof typeof Lo_assessmentsScalarFieldEnum];
export declare const Outbox_eventsScalarFieldEnum: {
    readonly id: "id";
    readonly event_type: "event_type";
    readonly aggregate_id: "aggregate_id";
    readonly payload_json: "payload_json";
    readonly status: "status";
    readonly attempts: "attempts";
    readonly error_msg: "error_msg";
    readonly created_at: "created_at";
    readonly updated_at: "updated_at";
};
export type Outbox_eventsScalarFieldEnum = (typeof Outbox_eventsScalarFieldEnum)[keyof typeof Outbox_eventsScalarFieldEnum];
export declare const Quiz_itemsScalarFieldEnum: {
    readonly id: "id";
    readonly document_id: "document_id";
    readonly primary_chunk_id: "primary_chunk_id";
    readonly source_chunk_ids: "source_chunk_ids";
    readonly heading_path: "heading_path";
    readonly question: "question";
    readonly choices: "choices";
    readonly correct_index: "correct_index";
    readonly explanation: "explanation";
    readonly difficulty: "difficulty";
    readonly question_index: "question_index";
    readonly model_id: "model_id";
    readonly created_at: "created_at";
    readonly lo_id: "lo_id";
    readonly assessment_id: "assessment_id";
    readonly bloom_level: "bloom_level";
};
export type Quiz_itemsScalarFieldEnum = (typeof Quiz_itemsScalarFieldEnum)[keyof typeof Quiz_itemsScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: "asc";
    readonly desc: "desc";
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const JsonNullValueInput: {
    readonly JsonNull: runtime.JsonNullClass;
};
export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput];
export declare const QueryMode: {
    readonly default: "default";
    readonly insensitive: "insensitive";
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
export declare const NullsOrder: {
    readonly first: "first";
    readonly last: "last";
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
export declare const JsonNullValueFilter: {
    readonly DbNull: runtime.DbNullClass;
    readonly JsonNull: runtime.JsonNullClass;
    readonly AnyNull: runtime.AnyNullClass;
};
export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter];
export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>;
export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>;
export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>;
export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>;
export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>;
export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>;
export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>;
export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>;
export type BigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt'>;
export type ListBigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt[]'>;
export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>;
export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>;
export type Enumlms_type_enumFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'lms_type_enum'>;
export type ListEnumlms_type_enumFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'lms_type_enum[]'>;
export type BatchPayload = {
    count: number;
};
export declare const defineExtension: runtime.Types.Extensions.ExtendsHook<"define", TypeMapCb, runtime.Types.Extensions.DefaultArgs>;
export type DefaultPrismaClient = PrismaClient;
export type ErrorFormat = 'pretty' | 'colorless' | 'minimal';
export type PrismaClientOptions = ({
    adapter: runtime.SqlDriverAdapterFactory;
    accelerateUrl?: never;
} | {
    accelerateUrl: string;
    adapter?: never;
}) & {
    errorFormat?: ErrorFormat;
    log?: (LogLevel | LogDefinition)[];
    transactionOptions?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: TransactionIsolationLevel;
    };
    omit?: GlobalOmitConfig;
    comments?: runtime.SqlCommenterPlugin[];
    queryPlanCacheMaxSize?: number;
};
export type GlobalOmitConfig = {
    assessments?: Prisma.assessmentsOmit;
    chapters?: Prisma.chaptersOmit;
    chunk_concepts?: Prisma.chunk_conceptsOmit;
    chunk_contents?: Prisma.chunk_contentsOmit;
    chunk_lo_mappings?: Prisma.chunk_lo_mappingsOmit;
    chunks_metadata?: Prisma.chunks_metadataOmit;
    concepts?: Prisma.conceptsOmit;
    courses?: Prisma.coursesOmit;
    documents_metadata?: Prisma.documents_metadataOmit;
    learning_outcomes?: Prisma.learning_outcomesOmit;
    lesson_cards?: Prisma.lesson_cardsOmit;
    lms_course_ref?: Prisma.lms_course_refOmit;
    lms_user_mappings?: Prisma.lms_user_mappingsOmit;
    lo_assessments?: Prisma.lo_assessmentsOmit;
    outbox_events?: Prisma.outbox_eventsOmit;
    quiz_items?: Prisma.quiz_itemsOmit;
};
export type LogLevel = 'info' | 'query' | 'warn' | 'error';
export type LogDefinition = {
    level: LogLevel;
    emit: 'stdout' | 'event';
};
export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;
export type GetLogType<T> = CheckIsLogLevel<T extends LogDefinition ? T['level'] : T>;
export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition> ? GetLogType<T[number]> : never;
export type QueryEvent = {
    timestamp: Date;
    query: string;
    params: string;
    duration: number;
    target: string;
};
export type LogEvent = {
    timestamp: Date;
    message: string;
    target: string;
};
export type PrismaAction = 'findUnique' | 'findUniqueOrThrow' | 'findMany' | 'findFirst' | 'findFirstOrThrow' | 'create' | 'createMany' | 'createManyAndReturn' | 'update' | 'updateMany' | 'updateManyAndReturn' | 'upsert' | 'delete' | 'deleteMany' | 'executeRaw' | 'queryRaw' | 'aggregate' | 'count' | 'runCommandRaw' | 'findRaw' | 'groupBy';
export type TransactionClient = Omit<DefaultPrismaClient, runtime.ITXClientDenyList>;
