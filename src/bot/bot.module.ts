import { forwardRef, Module } from '@nestjs/common';
import { CmsModule } from 'cms';
import { ConstantsModule } from 'config/constants';
import {
	ChannelModule,
	ChannelService,
	MessagesModule,
	PaymentModule,
} from 'crud';
import { SubscriptionModule } from 'crud/subscription';
import { SystemLoggerModule } from '@/config';
import { StudioAdminUsersService } from './admin-users.service';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';
import { TelegramClientModule } from './telegram-client.module';

@Module({
	imports: [
		ChannelModule,
		TelegramClientModule,
		ConstantsModule,
		SystemLoggerModule,
		MessagesModule,
		CmsModule,
		SubscriptionModule,
		forwardRef(() => PaymentModule),
	],
	providers: [BotService, BotUpdate, ChannelService, StudioAdminUsersService],
	exports: [BotService],
})
export class BotModule {}
