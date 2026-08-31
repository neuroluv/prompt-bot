import { ENV_NAMES } from '@lib/common/constants';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SystemLoggerModule } from 'config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { InternalTokenGuard } from './internal-token.guard';
import {
	MessagesController,
	NotificationsController,
} from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: ENV_NAMES.ENV_PATH(process.env.NODE_ENV),
			isGlobal: true,
		}),
		TelegrafModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (configService: ConfigService) => ({
				token: configService.get(ENV_NAMES.TELEGRAM_BOT_TOKEN),
				middlewares: [session()],
			}),
		}),
		SystemLoggerModule,
	],
	controllers: [MessagesController, NotificationsController],
	providers: [InternalTokenGuard, MessagesService],
	exports: [MessagesService],
})
export class MessagesModule {}
