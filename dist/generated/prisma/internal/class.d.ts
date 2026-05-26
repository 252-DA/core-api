import * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "./prismaNamespace.js";
export type LogOptions<ClientOptions extends Prisma.PrismaClientOptions> = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never;
export interface PrismaClientConstructor {
    new <Options extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions, LogOpts extends LogOptions<Options> = LogOptions<Options>, OmitOpts extends Prisma.PrismaClientOptions['omit'] = Options extends {
        omit: infer U;
    } ? U : Prisma.PrismaClientOptions['omit'], ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs>(options: Prisma.Subset<Options, Prisma.PrismaClientOptions>): PrismaClient<LogOpts, OmitOpts, ExtArgs>;
}
export interface PrismaClient<in LogOpts extends Prisma.LogLevel = never, in out OmitOpts extends Prisma.PrismaClientOptions['omit'] = undefined, in out ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['other'];
    };
    $on<V extends LogOpts>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;
    $connect(): runtime.Types.Utils.JsPromise<void>;
    $disconnect(): runtime.Types.Utils.JsPromise<void>;
    $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;
    $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;
    $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;
    $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;
    $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: Prisma.TransactionIsolationLevel;
    }): runtime.Types.Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>;
    $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => runtime.Types.Utils.JsPromise<R>, options?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: Prisma.TransactionIsolationLevel;
    }): runtime.Types.Utils.JsPromise<R>;
    $extends: runtime.Types.Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<OmitOpts>, ExtArgs, runtime.Types.Utils.Call<Prisma.TypeMapCb<OmitOpts>, {
        extArgs: ExtArgs;
    }>>;
    get assessments(): Prisma.assessmentsDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get chapters(): Prisma.chaptersDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get chunk_concepts(): Prisma.chunk_conceptsDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get chunk_contents(): Prisma.chunk_contentsDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get chunk_lo_mappings(): Prisma.chunk_lo_mappingsDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get chunks_metadata(): Prisma.chunks_metadataDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get concepts(): Prisma.conceptsDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get courses(): Prisma.coursesDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get documents_metadata(): Prisma.documents_metadataDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get learning_outcomes(): Prisma.learning_outcomesDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get lesson_cards(): Prisma.lesson_cardsDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get lms_course_ref(): Prisma.lms_course_refDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get lms_user_mappings(): Prisma.lms_user_mappingsDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get lo_assessments(): Prisma.lo_assessmentsDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get outbox_events(): Prisma.outbox_eventsDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
    get quiz_items(): Prisma.quiz_itemsDelegate<ExtArgs, {
        omit: OmitOpts;
    }>;
}
export declare function getPrismaClientClass(): PrismaClientConstructor;
