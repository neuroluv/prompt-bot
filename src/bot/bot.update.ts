import { CheckSubscription } from 'auth';
import { CmsService } from 'cms/cms.service';
import { SystemLoggerService } from 'config';
import { MessagesService } from 'crud';
import { CHANNELS_LINKS } from 'lib/common';
import { getValueFromAction } from 'lib/helpers';
import { emojis } from 'lib/utils';
import { Action, Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
import { performance } from 'node:perf_hooks';
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
    private readonly messageService: MessagesService,
    private readonly logger: SystemLoggerService,
    private readonly cms: CmsService,
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
  @Action(/^download-file-\S+$/)
  async downloadFile50(@Ctx() ctx: Context) {
    const promptFileName = getValueFromAction(ctx, 2, '-');

    const promptFile = await this.cms.getPromptFileByName(promptFileName);
    const start = performance.now(); // для измерения времени загрузки

    const loadingMessage = await ctx.reply(`${emojis.refresh} Загрузка...`);

    const file = Input.fromURLStream(
      `${this.cms.STATIC_FILES_URL}/${promptFile.file.filename_disk}?download=`,
      `${promptFile.file.filename_download}`,
    );

    const msg = await ctx.replyWithDocument(file, {
      caption: mainMessages.successMessage,
      reply_markup: {
        inline_keyboard: goToHomeKeyboard(),
      },
    });
    const seconds = (performance.now() - start) / 1000; // окончение измерения времени загрузки
    this.logger.log(
      `[pdf_send] ok chat=${ctx.chat?.id} user=${ctx.from?.id} file="${promptFile.title}" t=${seconds.toFixed(3)}s message_id=${msg.message_id}`,
    );

    await ctx.deleteMessage(loadingMessage.message_id);

    const user = await this.cms.upsertUser(ctx);
    await this.cms.createPromptFileStats(
      user.id,
      promptFile.id,
      promptFile.title,
    );
    return;
  }
}
