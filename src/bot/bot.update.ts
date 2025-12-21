import { ConfigService } from '@nestjs/config';
import { CheckSubscription } from 'auth';
import { MessagesService } from 'crud';
import { CHANNELS_LINKS } from 'lib/common';
import { getNormalChatId, getUserLink, getValueFromAction } from 'lib/helpers';
import { emojis } from 'lib/utils';
import { Action, Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
import { join } from 'path';
import { Context, Input, Telegraf } from 'telegraf';
import { SceneContext } from 'telegraf/scenes';
import { BotService } from './bot.service';
import {
  downloadKeyboard,
  goToHomeKeyboard,
  promptKeyboard,
} from './keyboards';
import { mainMessages } from './messages';

const myPromptFiles = {
  '50': join(__dirname, '..', '..', 'files', `prompts50.pdf`),
  '100': join(__dirname, '..', '..', 'files', `prompts100.pdf`),
  '107': join(__dirname, '..', '..', 'files', `prompts107.pdf`),
};

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
      myPromptFiles[promptFileName],
      `${promptFileName} промптов для фото Нейролюб.pdf`,
    );

    const loadingMessage = await ctx.reply(`${emojis.refresh} Загрузка...`);

    await ctx.replyWithDocument(file, {
      caption: mainMessages.successMessage,
      reply_markup: {
        inline_keyboard: goToHomeKeyboard(),
      },
    });

    await ctx.deleteMessage(loadingMessage.message_id);

    // Сообщение для ведения статистики в админ канал
    const downloadMessage = `${emojis.checkmark} Скачан файл – ${promptFileName} промптов\n${emojis.user} ${ctx.from.first_name} (${getUserLink(ctx.from.id, ctx.from.username)})\n${emojis.calendar} ${new Date().toLocaleString('ru')}`;

    // Отправка в админ канал для ведения статистики
    await this.messageService.sendMessageToChannel(
      getNormalChatId(CHANNELS_LINKS[1].value),
      downloadMessage,
    );
    return;
  }
}
