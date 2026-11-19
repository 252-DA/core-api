import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { BankAccessService } from './bank-access.service';
import { QuestionBankController } from './question-bank.controller';
import { QuestionBankService } from './question-bank.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [QuestionBankController],
  providers: [BankAccessService, QuestionBankService],
  exports: [BankAccessService, QuestionBankService],
})
export class QuestionBankModule {}
