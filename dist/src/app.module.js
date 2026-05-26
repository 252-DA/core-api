"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("@nestjs/bullmq");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const course_module_1 = require("./course/course.module");
const document_module_1 = require("./document/document.module");
const content_module_1 = require("./content/content.module");
const review_module_1 = require("./review/review.module");
const outbox_module_1 = require("./outbox/outbox.module");
const getRedisConnection = () => {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
        const parsed = new URL(redisUrl);
        return {
            host: parsed.hostname || 'localhost',
            port: parsed.port ? parseInt(parsed.port, 10) : 6379,
        };
    }
    catch (err) {
        return {
            host: 'localhost',
            port: 6379,
        };
    }
};
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            bullmq_1.BullModule.forRoot({
                connection: getRedisConnection(),
            }),
            prisma_module_1.PrismaModule,
            course_module_1.CourseModule,
            document_module_1.DocumentModule,
            content_module_1.ContentModule,
            review_module_1.ReviewModule,
            outbox_module_1.OutboxModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map