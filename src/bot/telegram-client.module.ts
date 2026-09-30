import { ENV_NAMES } from '@lib/common/constants';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { BotPollingService } from './bot-polling.service';

@Module({
	imports: [
		TelegrafModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				token: config.getOrThrow<string>(ENV_NAMES.TELEGRAM_BOT_TOKEN),
				// Only BotPollingService owns launch/stop. All consumers import
				// this shared static module instead of creating another poller.
				launchOptions: false,
				middlewares: [session()],
			}),
		}),
	],
	providers: [BotPollingService],
	exports: [TelegrafModule, BotPollingService],
})
export class TelegramClientModule {}
