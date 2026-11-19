import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { CanvasModule } from '../../integrations/canvas/canvas.module';
import { BankAccessService } from './bank-access.service';
import { QuestionBankSyncController } from './canvas/question-bank-sync.controller';
import { QuestionBankSyncProcessor } from './canvas/question-bank-sync.processor';
import { QuestionBankSyncService } from './canvas/question-bank-sync.service';
import { QuestionBankController } from './question-bank.controller';
import { QuestionBankService } from './question-bank.service';

@Module({
  imports: [AuthModule, PrismaModule, CanvasModule],
  controllers: [QuestionBankController, QuestionBankSyncController],
  providers: [
    BankAccessService,
    QuestionBankService,
    QuestionBankSyncService,
    QuestionBankSyncProcessor,
  ],
  exports: [BankAccessService, QuestionBankService],
})
export class QuestionBankModule {}
