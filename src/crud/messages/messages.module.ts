import { Module } from '@nestjs/common';
import { SystemLoggerModule } from 'config';
import { TelegramClientModule } from '../../bot/telegram-client.module';
import { InternalTokenGuard } from './internal-token.guard';
import {
	MessagesController,
	NotificationsController,
} from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
	imports: [TelegramClientModule, SystemLoggerModule],
	controllers: [MessagesController, NotificationsController],
	providers: [InternalTokenGuard, MessagesService],
	exports: [MessagesService],
})
export class MessagesModule {}
