import { Injectable } from '@nestjs/common';
import { channelsKeyboard } from 'bot/keyboards';
import { mainMessages } from 'bot/messages';
import { SystemLoggerService } from 'config';
import { CHANNELS_LINKS, GOOD_MEMBER_STATUSES } from 'lib/common';
import { getNormalChatId } from 'lib/helpers';
import { join } from 'path';
import { Context, Input } from 'telegraf';

@Injectable()
export class ChannelService {
  constructor(private readonly loggerService: SystemLoggerService) {
    this.loggerService.setContext(ChannelService.name);
  }

  // Проверка на подписку пользователя на канал
  async isUserSubs(ctx: Context) {
    try {
      const member = await ctx.telegram.getChatMember(
        getNormalChatId(CHANNELS_LINKS[0].value),
        ctx.from.id,
      );

      const isUserIncludes = GOOD_MEMBER_STATUSES.includes(member.status);
      if (!isUserIncludes) {
        await ctx.replyWithPhoto(
          Input.fromLocalFile(
            join(__dirname, '..', '..', '..', 'files', 'error_cat.jpeg'),
          ),
          {
            caption: mainMessages.needSubscribe,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: channelsKeyboard([CHANNELS_LINKS[0]]),
            },
          },
        );
      }
      return isUserIncludes;
    } catch (error) {
      this.loggerService.error(error, ChannelService.name);
      return false;
    }
  }
}
