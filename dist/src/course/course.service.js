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
exports.CourseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CourseService = class CourseService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listCourses() {
        return this.prisma.courses.findMany({
            orderBy: { created_at: 'desc' },
        });
    }
    async getCourse(courseId) {
        const course = await this.prisma.courses.findUnique({
            where: { course_id: courseId },
        });
        if (!course) {
            throw new common_1.NotFoundException(`Course not found: ${courseId}`);
        }
        return course;
    }
    async createCourse(data) {
        return this.prisma.courses.create({
            data: {
                course_id: data.course_id,
                code: data.code,
                title_vi: data.title_vi,
                title_en: data.title_en,
                credits: data.credits,
                semester: data.semester,
            },
        });
    }
    async getChapters(courseId) {
        await this.getCourse(courseId);
        return this.prisma.chapters.findMany({
            where: { course_id: courseId },
            orderBy: { order_index: 'asc' },
        });
    }
    async getLearningOutcomes(courseId) {
        await this.getCourse(courseId);
        return this.prisma.learning_outcomes.findMany({
            where: { course_id: courseId },
            orderBy: { code: 'asc' },
        });
    }
    async getAssessments(courseId) {
        await this.getCourse(courseId);
        return this.prisma.assessments.findMany({
            where: { course_id: courseId },
            orderBy: { code: 'asc' },
        });
    }
};
exports.CourseService = CourseService;
exports.CourseService = CourseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CourseService);
//# sourceMappingURL=course.service.js.map