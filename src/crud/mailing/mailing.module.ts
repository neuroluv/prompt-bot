import { Module } from '@nestjs/common';
import { MailingService } from './mailing.service';
import { MailingController } from './mailing.controller';
import { CmsModule } from 'cms/cms.module';
import { BotModule } from 'bot';
import { SystemLoggerService } from 'config';

@Module({
  imports: [CmsModule, BotModule],
  controllers: [MailingController],
  providers: [MailingService, SystemLoggerService],
})
export class MailingModule {}
