import { BadGatewayException, Injectable } from '@nestjs/common';
import { SystemLoggerService } from 'config';
import { CHATS } from 'lib/common';
import type { IAdminMessage } from 'lib/types';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import type {
  ForceReply,
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
} from 'telegraf/types';

type MarkupType =
  | InlineKeyboardMarkup
  | ReplyKeyboardMarkup
  | ReplyKeyboardRemove
  | ForceReply;

@Injectable()
export class MessagesService {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly loggerService: SystemLoggerService,
  ) {
    this.loggerService.setContext(MessagesService.name);
  }
  async sendMessageByChatId(
    chatId: number,
    message: string,
    markup?: MarkupType,
  ) {
    try {
      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        reply_markup: markup,
      });
    } catch (error) {
      this.loggerService.error(
        `Пользователь ${chatId} не получил сообщения из за блокировки бота.\n\n${error}`,
        error,
      );
    }

    return;
  }

  async sendMessageToChannel(
    channelSlug: string,
    message: string,
    markup?: MarkupType,
  ) {
    try {
      await this.bot.telegram.sendMessage(channelSlug, message, {
        parse_mode: 'HTML',
        reply_markup: markup,
      });
    } catch (error) {
      this.loggerService.error(
        `Не получилось отправить сообщение в канал ${channelSlug}`,
        error,
      );
    }

    return;
  }

  async sendAdminMessage(message: IAdminMessage, markup?: MarkupType) {
    try {
      const admins = CHATS;

      if (!admins || !admins.length) {
        return;
      }

      const botMessage = `<b>${message.title}</b>\n\n${message.text}`;

      for (const admin of admins) {
        await this.bot.telegram.sendMessage(admin, botMessage, {
          parse_mode: 'HTML',
          reply_markup: markup,
        });
      }

      return true;
    } catch (error) {
      return new BadGatewayException({
        message: `Не удалось отправить сообщение админам.\n\n${error}`,
      });
    }
  }
}
