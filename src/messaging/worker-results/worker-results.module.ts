import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { WorkerResultHandlerRegistry } from './worker-result-handler.registry';
import { WorkerResultsProcessor } from './worker-results.processor';

/**
 * Không import module domain nào: handler nằm ở module domain và được tìm qua
 * DiscoveryService, nên không có phụ thuộc vòng và thêm luồng không sửa ở đây.
 */
@Module({
  imports: [DiscoveryModule],
  providers: [WorkerResultHandlerRegistry, WorkerResultsProcessor],
})
export class WorkerResultsModule {}
