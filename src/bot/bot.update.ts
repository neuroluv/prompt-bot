import { ConfigService } from '@nestjs/config';
import { CheckSubscription } from 'auth';
import { CmsService } from 'cms/cms.service';
import { SystemLoggerService } from 'config';
import { ConstantsService } from 'config/constants';
import { SubscriptionPlanService } from 'crud/subscription';
import { parseTelegramAdminIds } from 'lib/common';
import { getValueFromAction } from 'lib/helpers';
import {
	Action,
	Command,
	Ctx,
	InjectBot,
	Start,
	Update,
} from 'nestjs-telegraf';
import { performance } from 'node:perf_hooks';
import { Context, Input, Telegraf } from 'telegraf';
import { SceneContext } from 'telegraf/scenes';
import {
	StudioAdminUsersService,
	StudioAdminUserSummary,
} from './admin-users.service';
import {
	appKeyboard,
	goToHomeKeyboard,
	guideFilesKeyboard,
	mainKeyboard,
} from './keyboards';
import {
	adminUserKeyboard,
	directusUserUrl,
} from './keyboards/admin-user.keyboard';
import { appMessages, guideFilesMessages, mainMessages } from './messages';
import { startScenarios } from './scenarios';

@Update()
export class BotUpdate {
	PRIVATE_CHANNEL_SLUG: string;
	private readonly adminIds: ReadonlySet<number>;
	private readonly directusUrl: string;
	constructor(
		@InjectBot() private readonly bot: Telegraf<Context>,
		private readonly logger: SystemLoggerService,
		private readonly cms: CmsService,
		private readonly subscriptionPlanService: SubscriptionPlanService,
		private readonly constants: ConstantsService,
		private readonly config: ConfigService,
		private readonly studioAdminUsers: StudioAdminUsersService,
	) {
		this.adminIds = new Set(
			parseTelegramAdminIds(this.config.get<string>('TELEGRAM_ADMIN_IDS')),
		);
		this.directusUrl =
			this.config.get<string>('NEUROLUV_DIRECTUS_URL')?.trim() ||
			'https://admin.neuroluv.ru';
	}

	@Action(
		/^admin_user:(block|status|unblock):([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i,
	)
	async adminUserAction(@Ctx() ctx: Context) {
		const adminId = ctx.from?.id;
		if (!adminId || !this.adminIds.has(adminId)) {
			await ctx.answerCbQuery('Недостаточно прав', { show_alert: true });
			return;
		}
		const data = callbackData(ctx);
		const match = /^admin_user:(block|status|unblock):([0-9a-f-]{36})$/i.exec(
			data,
		);
		if (!match) {
			await ctx.answerCbQuery('Некорректное действие', { show_alert: true });
			return;
		}
		const action = match[1] as 'block' | 'status' | 'unblock';
		const userId = match[2];

		try {
			const result =
				action === 'block'
					? await this.studioAdminUsers.block(userId, adminId)
					: action === 'unblock'
						? await this.studioAdminUsers.unblock(userId, adminId)
						: await this.studioAdminUsers.summary(userId);

			if (action === 'status') {
				await ctx.answerCbQuery(adminUserSummary(result), { show_alert: true });
			} else {
				const mutation = result as StudioAdminUserSummary & {
					changed: boolean;
					revokedSessions?: number;
				};
				const changed = mutation.changed;
				await ctx.answerCbQuery(
					action === 'block'
						? changed
							? `Аккаунт заблокирован. Отозвано сессий: ${mutation.revokedSessions ?? 0}`
							: 'Аккаунт уже был заблокирован'
						: changed
							? 'Аккаунт разблокирован. Пользователю потребуется войти заново.'
							: 'Аккаунт уже активен',
					{ show_alert: true },
				);
			}

			try {
				await ctx.editMessageReplyMarkup(
					adminUserKeyboard({
						directusUrl: directusUserUrl(this.directusUrl, userId),
						status: result.status,
						userId,
					}),
				);
			} catch {
				// Another administrator may have already refreshed this copy of the message.
			}
		} catch (error) {
			this.logger.error(
				'Не удалось выполнить действие администратора с аккаунтом',
				error,
			);
			await ctx.answerCbQuery(
				'Не удалось выполнить действие. Проверьте API и повторите.',
				{
					show_alert: true,
				},
			);
		}
	}

	private async isPreparedStartParam(ctx: Context | SceneContext) {
		const value = getValueFromAction(ctx, {
			separator: '=',
			index: 1,
		});

		switch (startScenarios[value]) {
			case startScenarios.app:
				await this.startApp(ctx as SceneContext);
				break;
			case startScenarios.files:
				await this.guideFiles(ctx as SceneContext);
				break;

			default:
				await ctx.reply(mainMessages.hello, {
					parse_mode: 'HTML',
					link_preview_options: {
						is_disabled: true,
					},
					reply_markup: {
						inline_keyboard: mainKeyboard(
							`${this.constants.SITE_URL.replace(/\/$/, '')}/ai`,
						),
					},
				});
				break;
		}
	}

	@Action('main-menu')
	@Action(/^\/start[ =](.+)$/)
	@Start()
	async start(@Ctx() ctx: Context) {
		await this.isPreparedStartParam(ctx);
		await this.cms.upsertUser(ctx);
		return;
	}

	@Action('app')
	@Command('app')
	async startApp(@Ctx() ctx: Context) {
		await ctx.reply(appMessages.welcome, {
			parse_mode: 'HTML',
			link_preview_options: {
				is_disabled: true,
			},
			reply_markup: {
				inline_keyboard: appKeyboard(
					`${this.constants.SITE_URL.replace(/\/$/, '')}/ai`,
				),
			},
		});
		return;
	}

	@Action('guide_files')
	@Command('guide_files')
	async guideFiles(@Ctx() ctx: Context) {
		await ctx.reply(guideFilesMessages.hello, {
			parse_mode: 'HTML',
			link_preview_options: {
				is_disabled: true,
			},
			reply_markup: {
				inline_keyboard: guideFilesKeyboard(),
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
				inline_keyboard: mainKeyboard(
					`${this.constants.SITE_URL.replace(/\/$/, '')}/ai`,
				),
			},
		});
		return;
	}

	@Action(/^download-file-\S+$/)
	@CheckSubscription()
	async downloadFile(@Ctx() ctx: Context) {
		const promptFileName = getValueFromAction(ctx, {
			separator: '-',
			index: 2,
		});

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

function callbackData(ctx: Context): string {
	const query = ctx.callbackQuery;
	return query && 'data' in query && typeof query.data === 'string'
		? query.data
		: '';
}

function adminUserSummary(user: StudioAdminUserSummary): string {
	const status = user.status === 'blocked' ? 'заблокирован' : user.status;
	return [
		`Статус: ${status}`,
		`Баланс: ${user.balanceCredits}, резерв: ${user.reservedCredits}`,
		`Запуски: ${user.successfulRuns}/${user.totalRuns}`,
		...(user.emailDomain
			? [`Аккаунтов с доменом ${user.emailDomain}: ${user.emailDomainAccounts}`]
			: []),
		`Аккаунтов с того же IP: ${user.sameIpAccounts}`,
		`Активных сессий: ${user.activeSessions}`,
	].join('\n');
}
