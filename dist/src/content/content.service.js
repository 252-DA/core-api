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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ContentService = class ContentService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getLessonCards(documentId) {
        const doc = await this.prisma.documents_metadata.findUnique({
            where: { document_id: documentId },
        });
        if (!doc) {
            throw new common_1.NotFoundException(`Document not found: ${documentId}`);
        }
        return this.prisma.lesson_cards.findMany({
            where: { document_id: documentId },
            orderBy: { card_index: 'asc' },
        });
    }
    async getQuizItems(documentId) {
        const doc = await this.prisma.documents_metadata.findUnique({
            where: { document_id: documentId },
        });
        if (!doc) {
            throw new common_1.NotFoundException(`Document not found: ${documentId}`);
        }
        return this.prisma.quiz_items.findMany({
            where: { document_id: documentId },
            orderBy: { question_index: 'asc' },
            include: {
                learning_outcomes: true,
                assessments: true,
            },
        });
    }
};
exports.ContentService = ContentService;
exports.ContentService = ContentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContentService);
//# sourceMappingURL=content.service.js.map