import { SystemLoggerService } from '@/config';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';

@Injectable()
export class BotService {
  private bot: Telegraf;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: SystemLoggerService,
  ) {
    this.loggerService.setContext(BotService.name);
    this.bot = new Telegraf(
      this.configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN')!,
    );
  }

  get telegram() {
    return this.bot.telegram;
  }
}
