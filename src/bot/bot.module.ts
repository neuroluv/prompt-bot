import { SystemLoggerModule } from '@/config';
import { ENV_NAMES } from '@lib/common/constants';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CmsModule } from 'cms';
import {
  ChannelModule,
  ChannelService,
  MessagesModule,
  PaymentModule,
} from 'crud';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';
import { SubscriptionModule } from 'crud/subscription';
import { ConstantsModule } from 'config/constants';

@Module({
  imports: [
    ChannelModule,
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        token: configService.get(ENV_NAMES.TELEGRAM_BOT_TOKEN),
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
  providers: [BotService, BotUpdate, ChannelService],
  exports: [BotService],
})
export class BotModule {}
