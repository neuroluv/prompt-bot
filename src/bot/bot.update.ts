import { ConfigService } from '@nestjs/config';
import { CheckSubscription } from 'auth';
import { MessagesService } from 'crud';
import { CHANNELS_LINKS } from 'lib/common';
import { getNormalChatId, getValueFromAction } from 'lib/helpers';
import { emojis } from 'lib/utils';
import { Action, Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
import { Context, Input, Telegraf } from 'telegraf';
import { SceneContext } from 'telegraf/scenes';
import { BotService } from './bot.service';
import {
  downloadKeyboard,
  goToHomeKeyboard,
  promptKeyboard,
} from './keyboards';
import { mainMessages } from './messages';

@Update()
export class BotUpdate {
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly botService: BotService,
    private readonly configService: ConfigService,
    private readonly messageService: MessagesService,
  ) {}

  @Action('main-menu')
  @Start()
  async start(@Ctx() ctx: SceneContext) {
    await ctx.reply(mainMessages.helloMessage, {
      reply_markup: {
        inline_keyboard: promptKeyboard(CHANNELS_LINKS[0]),
      },
    });
    return;
  }

  @Action('check-subs')
  @CheckSubscription()
  async checkSubs(@Ctx() ctx: SceneContext) {
    await ctx.reply(mainMessages.helloMessage, {
      reply_markup: {
        inline_keyboard: promptKeyboard(CHANNELS_LINKS[0]),
      },
    });
    return;
  }

  @CheckSubscription()
  @Action(/^prompts-\d+$/)
  async prompt50(@Ctx() ctx: Context) {
    const promptsCount = getValueFromAction(ctx, 1, '-');

    await ctx.reply(mainMessages.helloMessage, {
      reply_markup: {
        inline_keyboard: downloadKeyboard(promptsCount),
      },
    });
    return;
  }

  @CheckSubscription()
  @Action(/^download-file-\d+$/)
  async downloadFile50(@Ctx() ctx: Context) {
    const promptFileName = getValueFromAction(ctx, 2, '-');
    const file = Input.fromLocalFile(
      this.botService.getPromptFilePath(promptFileName),
      `${promptFileName} промптов для фото Нейролюб.pdf`,
    );

    await ctx.replyWithPhoto(
      Input.fromLocalFile(this.botService.getPhotoFile('cat.jpeg')),
      {
        caption: mainMessages.successMessage,
      },
    );

    await ctx.replyWithDocument(file, {
      reply_markup: {
        inline_keyboard: goToHomeKeyboard(),
      },
    });

    // Сообщение для ведения статистики в админ канал
    const downloadMessage = `${emojis.checkmark} Скачан файл – ${promptFileName} промптов\n${emojis.user} ${ctx.from.first_name} (@${ctx.from.username})\n${emojis.calendar} ${new Date().toLocaleString('ru')}`;

    // Отправка в админ канал для ведения статистики
    await this.messageService.sendMessageToChannel(
      getNormalChatId(CHANNELS_LINKS[1].value),
      downloadMessage,
    );
    return;
  }
}
