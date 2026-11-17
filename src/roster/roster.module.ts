import { Module } from '@nestjs/common';
import { PrismaModule } from '../infra/prisma/prisma.module';
import { CanvasModule } from '../integrations/canvas/canvas.module';
import { LtiPlatformModule } from '../integrations/lti-platform/lti-platform.module';
import { CourseRosterRepository } from './course-roster.repository';
import { NrpsClientService } from './nrps-client.service';
import { RosterSyncService } from './roster-sync.service';

/**
 * Danh sách lớp Canvas (NRPS): đọc thành viên, ghi lms_user_mappings và
 * course_memberships. Không phụ thuộc CanvasSyncModule: hàng đợi và lịch sử chạy
 * nằm ở đó, và nó gọi sang module này.
 */
@Module({
  imports: [PrismaModule, LtiPlatformModule, CanvasModule],
  providers: [CourseRosterRepository, NrpsClientService, RosterSyncService],
  exports: [CourseRosterRepository, NrpsClientService, RosterSyncService],
})
export class RosterModule {}
