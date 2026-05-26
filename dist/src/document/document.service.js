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
exports.DocumentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const crypto_1 = require("crypto");
let DocumentService = class DocumentService {
    prisma;
    processingQueue;
    enrichmentQueue;
    constructor(prisma, processingQueue, enrichmentQueue) {
        this.prisma = prisma;
        this.processingQueue = processingQueue;
        this.enrichmentQueue = enrichmentQueue;
    }
    async listDocuments(courseId, limit = 50, offset = 0) {
        const whereClause = courseId ? { course_id: courseId } : {};
        const docs = await this.prisma.documents_metadata.findMany({
            where: whereClause,
            take: limit,
            skip: offset,
            orderBy: { created_at: 'desc' },
        });
        return Promise.all(docs.map(async (doc) => {
            const chunks_count = await this.prisma.chunks_metadata.count({
                where: { document_id: doc.document_id },
            });
            return {
                document_id: doc.document_id,
                document_name: doc.document_name,
                doc_type: doc.doc_type,
                mime_type: doc.mime_type,
                size_bytes: Number(doc.size_bytes),
                storage_key: doc.storage_key,
                course_id: doc.course_id,
                owner_id: doc.owner_id,
                language: doc.language,
                status: doc.status,
                error_msg: doc.error_msg,
                metadata_json: doc.metadata_json,
                created_at: doc.created_at,
                updated_at: doc.updated_at,
                chunks_count,
            };
        }));
    }
    async getDocument(documentId) {
        const doc = await this.prisma.documents_metadata.findUnique({
            where: { document_id: documentId },
        });
        if (!doc) {
            throw new common_1.NotFoundException(`Document not found: ${documentId}`);
        }
        const chunks_count = await this.prisma.chunks_metadata.count({
            where: { document_id: documentId },
        });
        return {
            document_id: doc.document_id,
            document_name: doc.document_name,
            doc_type: doc.doc_type,
            mime_type: doc.mime_type,
            size_bytes: Number(doc.size_bytes),
            storage_key: doc.storage_key,
            course_id: doc.course_id,
            owner_id: doc.owner_id,
            language: doc.language,
            status: doc.status,
            error_msg: doc.error_msg,
            metadata_json: doc.metadata_json,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            chunks_count,
        };
    }
    async getDocumentChunks(documentId) {
        await this.getDocument(documentId);
        return this.prisma.chunks_metadata.findMany({
            where: { document_id: documentId },
            orderBy: { chunk_index: 'asc' },
            include: {
                chunk_contents: true,
            },
        });
    }
    async registerAndProcess(data) {
        const documentId = data.document_id || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const metadata = data.metadata_json || {};
        if (data.course_id)
            metadata.course_id = data.course_id;
        if (data.owner_id)
            metadata.owner_id = data.owner_id;
        if (data.storage_key)
            metadata.storage_key = data.storage_key;
        if (data.language)
            metadata.language = data.language;
        const doc = await this.prisma.documents_metadata.create({
            data: {
                document_id: documentId,
                document_name: data.document_name,
                doc_type: data.doc_type,
                mime_type: data.mime_type,
                size_bytes: BigInt(data.size_bytes),
                storage_key: data.storage_key,
                course_id: data.course_id,
                owner_id: data.owner_id,
                language: data.language || 'vi',
                status: 'QUEUED',
                metadata_json: metadata,
            },
        });
        const payload = {
            document_id: documentId,
            storage_key: data.storage_key,
            file_name: data.document_name,
            language: data.language || 'vi',
            metadata: metadata,
        };
        const job = await this.processingQueue.add('process_document', payload, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
        });
        return {
            document_id: documentId,
            status: 'QUEUED',
            job_id: job.id,
        };
    }
    async triggerEnrichment(documentId) {
        const doc = await this.getDocument(documentId);
        const job = await this.enrichmentQueue.add('enrich_document', {
            document_id: documentId,
        }, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
        });
        return {
            document_id: documentId,
            status: doc.status,
            enrichment_job_id: job.id,
        };
    }
    async deleteDocument(documentId) {
        const doc = await this.getDocument(documentId);
        await this.prisma.documents_metadata.delete({
            where: { document_id: documentId },
        });
        await this.prisma.outbox_events.create({
            data: {
                id: (0, crypto_1.randomUUID)(),
                event_type: 'document_deleted',
                aggregate_id: documentId,
                payload_json: {
                    document_id: documentId,
                },
                status: 'PENDING',
            },
        });
        return {
            document_id: documentId,
            success: true,
            message: `Document ${documentId} deleted successfully and outbox event registered.`,
        };
    }
};
exports.DocumentService = DocumentService;
exports.DocumentService = DocumentService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bullmq_1.InjectQueue)('document_processing')),
    __param(2, (0, bullmq_1.InjectQueue)('document_enrichment')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_2.Queue,
        bullmq_2.Queue])
], DocumentService);
//# sourceMappingURL=document.service.js.map