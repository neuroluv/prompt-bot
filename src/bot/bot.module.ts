import { ENV_NAMES } from '@lib/common/constants';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CmsModule } from 'cms';
import { ConstantsModule } from 'config/constants';
import {
	ChannelModule,
	ChannelService,
	MessagesModule,
	PaymentModule,
} from 'crud';
import { SubscriptionModule } from 'crud/subscription';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { SystemLoggerModule } from '@/config';
import { StudioAdminUsersService } from './admin-users.service';
import { BotPollingService } from './bot-polling.service';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';

@Module({
	imports: [
		ChannelModule,
		TelegrafModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (configService: ConfigService) => ({
				token: configService.get(ENV_NAMES.TELEGRAM_BOT_TOKEN),
				launchOptions: false,
				middlewares: [session()],
			}),
		}),
		ConstantsModule,
		SystemLoggerModule,
		MessagesModule,
		CmsModule,
		SubscriptionModule,
		forwardRef(() => PaymentModule),
	],
	providers: [
		BotService,
		BotUpdate,
		ChannelService,
		StudioAdminUsersService,
		BotPollingService,
	],
	exports: [BotService, BotPollingService],
})
export class BotModule {}
