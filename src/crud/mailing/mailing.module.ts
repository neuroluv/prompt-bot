import { Module } from '@nestjs/common';
import { BotModule } from 'bot';
import { CmsModule } from 'cms';
import { SystemLoggerService } from 'config';
import { MailingController } from './mailing.controller';
import { MailingService } from './mailing.service';

@Module({
  imports: [CmsModule, BotModule],
  controllers: [MailingController],
  providers: [MailingService, SystemLoggerService],
})
export class MailingModule {}
