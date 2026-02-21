import { CheckSubscription } from 'auth';
import { CmsService } from 'cms/cms.service';
import { SystemLoggerService } from 'config';
import { CryptoBotPaymentService, YookassaPaymentService } from 'crud/payment';
import { CHANNELS_LINKS } from 'lib/common';
import { getValueFromAction } from 'lib/helpers';
import { Action, Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
import { performance } from 'node:perf_hooks';
import { Context, Input, Telegraf } from 'telegraf';
import { SceneContext } from 'telegraf/scenes';
import {
  goToHomeKeyboard,
  promptKeyboard,
  payKeyboard,
  payFromSubPlansKeyboard,
} from './keyboards';
import { mainMessages, payMessages } from './messages';
import { SubscriptionPlanService } from 'crud/subscription';
import { isFiatCurrency, PAY_NEUROLUV_CLUB_CURRENCY_REGEX } from 'lib/utils';

@Update()
export class BotUpdate {
  PRIVATE_CHANNEL_SLUG: string;
  constructor(
    @InjectBot() private readonly bot: Telegraf<Context>,
    private readonly logger: SystemLoggerService,
    private readonly cms: CmsService,
    private readonly subscriptionPlanService: SubscriptionPlanService,
    private readonly yookassaPaymentService: YookassaPaymentService,
    private readonly cryptoPaymentService: CryptoBotPaymentService,
  ) {}

  @Action('main-menu')
  @Start()
  async start(@Ctx() ctx: SceneContext) {
    this.cms.upsertUser(ctx);
    await ctx.reply(mainMessages.hello, {
      parse_mode: 'HTML',
      link_preview_options: {
        is_disabled: true,
      },
      reply_markup: {
        inline_keyboard: promptKeyboard(CHANNELS_LINKS[0]),
      },
    });
    return;
  }

  @Action('check-subs')
  @CheckSubscription()
  async checkSubs(@Ctx() ctx: SceneContext) {
    await ctx.reply(mainMessages.hello, {
      parse_mode: 'HTML',
      link_preview_options: {
        is_disabled: true,
      },
      reply_markup: {
        inline_keyboard: promptKeyboard(CHANNELS_LINKS[0]),
      },
    });
    return;
  }

  @Action('neuroluv_club')
  @CheckSubscription()
  async prePayPrivateChannel(@Ctx() ctx: SceneContext) {
    const channels = await this.subscriptionPlanService.getPlanssByIncludeSlug(
      this.subscriptionPlanService.privateChannelSlug,
    );

    await ctx.reply(payMessages.prePay, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: payFromSubPlansKeyboard(channels),
      },
    });
    return;
  }

  @Action(PAY_NEUROLUV_CLUB_CURRENCY_REGEX)
  @CheckSubscription()
  async payPrivateChannel(@Ctx() ctx: SceneContext) {
    const price = getValueFromAction(ctx, 2);
    const currency = getValueFromAction(ctx, 3);
    const loadingMessage = await ctx.reply(mainMessages.loading, {
      parse_mode: 'HTML',
    });

    const isFiat = isFiatCurrency(currency);
    let createdPayment;
    const plan = await this.subscriptionPlanService.getPlanByPriceAndCurrency(
      +price,
      currency,
    );
    try {
      if (isFiat) {
        createdPayment = await this.yookassaPaymentService.create(
          ctx.from.id ? ctx.from.id : ctx.callbackQuery.from.id,
          plan,
        );
      } else {
        createdPayment = await this.cryptoPaymentService.create(
          ctx.from.id ? ctx.from.id : ctx.callbackQuery.from.id,
          plan,
        );
      }

      await ctx.reply(isFiat ? payMessages.pay : payMessages.cryptoPay, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: payKeyboard(
            +price,
            currency,
            isFiat
              ? createdPayment.confirmation.confirmation_url
              : createdPayment.botPayUrl,
          ),
        },
      });
    } catch (error) {
      const typedError: Error = error as Error;
      ctx.reply(payMessages.errorCreate(typedError.message), {
        parse_mode: 'HTML',
      });
    } finally {
      await ctx.deleteMessage(loadingMessage.message_id);
    }

    return;
  }

  @CheckSubscription()
  @Action(/^download-file-\S+$/)
  async downloadFile(@Ctx() ctx: Context) {
    const promptFileName = getValueFromAction(ctx, 2, '-');

    const promptFile = await this.cms.getPromptFileByName(promptFileName);
    const start = performance.now(); // для измерения времени загрузки

    const loadingMessage = await ctx.reply(mainMessages.loading, {
      parse_mode: 'HTML',
    });

    const file = Input.fromURLStream(
      `${this.cms.STATIC_FILES_URL}/${promptFile.file.filename_disk}?download=`,
      `${promptFile.file.filename_download}`,
    );

    const msg = await ctx.replyWithDocument(file, {
      caption: mainMessages.successDownload,
      parse_mode: 'HTML',
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
