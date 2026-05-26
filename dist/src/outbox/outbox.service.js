"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboxService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let OutboxService = class OutboxService {
    prisma;
    outboxRelayQueue;
    running = true;
    pollTimeout = null;
    constructor(prisma, outboxRelayQueue) {
        this.prisma = prisma;
        this.outboxRelayQueue = outboxRelayQueue;
    }
    onModuleInit() {
        console.log('Outbox Poller daemon starting...');
        this.startPolling();
    }
    onModuleDestroy() {
        this.running = false;
        if (this.pollTimeout) {
            clearTimeout(this.pollTimeout);
        }
        console.log('Outbox Poller daemon stopped.');
    }
    async startPolling() {
        if (!this.running)
            return;
        try {
            await this.pollAndRelay();
        }
        catch (err) {
            console.error('Outbox Poller error during run:', err);
        }
        this.pollTimeout = setTimeout(() => this.startPolling(), 5000);
    }
    async pollAndRelay() {
        const events = await this.prisma.$transaction(async (tx) => {
            const pendingEvents = await tx.outbox_events.findMany({
                where: { status: 'PENDING' },
                orderBy: { created_at: 'asc' },
                take: 10,
            });
            if (pendingEvents.length === 0) {
                return [];
            }
            const eventIds = pendingEvents.map(e => e.id);
            await tx.outbox_events.updateMany({
                where: { id: { in: eventIds } },
                data: {
                    status: 'PROCESSING',
                    updated_at: new Date(),
                },
            });
            return pendingEvents;
        });
        if (events.length === 0) {
            return;
        }
        console.log(`Outbox Poller: Found ${events.length} pending events to relay.`);
        for (const event of events) {
            try {
                const payload = {
                    event_id: event.id,
                    event_type: event.event_type,
                    aggregate_id: event.aggregate_id,
                    payload: event.payload_json,
                };
                await this.outboxRelayQueue.add(event.event_type, payload, {
                    attempts: 5,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                });
                await this.prisma.outbox_events.update({
                    where: { id: event.id },
                    data: {
                        status: 'COMPLETED',
                        attempts: event.attempts + 1,
                        updated_at: new Date(),
                    },
                });
                console.log(`Outbox Poller: Successfully relayed event ${event.id} (${event.event_type})`);
            }
            catch (err) {
                console.error(`Outbox Poller: Failed to relay event ${event.id}:`, err);
                await this.prisma.outbox_events.update({
                    where: { id: event.id },
                    data: {
                        status: 'FAILED',
                        attempts: event.attempts + 1,
                        error_msg: err.message || String(err),
                        updated_at: new Date(),
                    },
                });
            }
        }
    }
};
exports.OutboxService = OutboxService;
exports.OutboxService = OutboxService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_1.InjectQueue)('outbox_relay')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_2.Queue])
], OutboxService);
//# sourceMappingURL=outbox.service.js.map