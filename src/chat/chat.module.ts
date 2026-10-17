import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatService } from './chat.service';

@Module({
  imports: [AuthModule, PrismaModule],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
