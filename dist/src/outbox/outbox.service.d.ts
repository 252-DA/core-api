import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Queue } from 'bullmq';
export declare class OutboxService implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly outboxRelayQueue;
    private running;
    private pollTimeout;
    constructor(prisma: PrismaService, outboxRelayQueue: Queue);
    onModuleInit(): void;
    onModuleDestroy(): void;
    private startPolling;
    pollAndRelay(): Promise<void>;
}
