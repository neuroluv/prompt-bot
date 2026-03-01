import { Module } from '@nestjs/common';
import { BotModule } from 'bot';
import { CmsModule } from 'cms';
import { SystemLoggerModule } from 'config';
import { MailingController } from './mailing.controller';
import { MailingService } from './mailing.service';

@Module({
	imports: [CmsModule, BotModule, SystemLoggerModule],
	controllers: [MailingController],
	providers: [MailingService],
})
export class MailingModule {}
