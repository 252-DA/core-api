import { Module } from '@nestjs/common';
import { AgsModule } from '../ags/ags.module';
import { CanvasModule } from '../canvas/canvas.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CourseRosterRepository } from './course-roster.repository';
import { NrpsClientService } from './nrps-client.service';
import { RosterSyncService } from './roster-sync.service';

/**
 * Danh sách lớp Canvas (NRPS): đọc thành viên, ghi lms_user_mappings và
 * course_memberships. Không phụ thuộc DocumentModule: hàng đợi và lịch sử chạy
 * nằm ở đó, và nó gọi sang module này.
 */
@Module({
  imports: [PrismaModule, AgsModule, CanvasModule],
  providers: [CourseRosterRepository, NrpsClientService, RosterSyncService],
  exports: [CourseRosterRepository, NrpsClientService, RosterSyncService],
})
export class RosterModule {}
