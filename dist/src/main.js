"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const platform_fastify_1 = require("@nestjs/platform-fastify");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_fastify_1.FastifyAdapter());
    app.enableCors({
        origin: '*',
        allowedHeaders: 'Content-Type, Authorization',
        methods: 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
    await app.listen(port, '0.0.0.0');
    console.log(`Core API running on: http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map