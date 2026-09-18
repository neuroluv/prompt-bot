import {
	BadGatewayException,
	GoneException,
	Injectable,
	ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SystemLoggerService } from 'config';
import { parseTelegramAdminIds } from 'lib/common';
import type { IAdminMessage } from 'lib/types';
import { InjectBot } from 'nestjs-telegraf';
import { Context, Input, Telegraf } from 'telegraf';
import type {
	ForceReply,
	InlineKeyboardMarkup,
	ReplyKeyboardMarkup,
	ReplyKeyboardRemove,
} from 'telegraf/types';
import { adminGenerationKeyboard } from '../../bot/keyboards/admin-generation.keyboard';
import {
	adminUserKeyboard,
	directusUserUrl,
} from '../../bot/keyboards/admin-user.keyboard';
import type { AccountNotificationDto } from './dto/account-notification.dto';
import type { AdminGenerationNotificationDto } from './dto/admin-generation-notification.dto';
import type { AdminNotificationDto } from './dto/admin-notification.dto';
import type { GenerationNotificationDto } from './dto/generation-notification.dto';

type MarkupType =
	| InlineKeyboardMarkup
	| ReplyKeyboardMarkup
	| ReplyKeyboardRemove
	| ForceReply;

const TELEGRAM_CAPTION_LIMIT = 1_024;
const TELEGRAM_MESSAGE_LIMIT = 4_096;

@Injectable()
export class MessagesService {
	constructor(
		@InjectBot() private readonly bot: Telegraf<Context>,
		private readonly loggerService: SystemLoggerService,
		private readonly config: ConfigService,
	) {
		this.loggerService.setContext(MessagesService.name);
	}

	async sendAdminNotification(
		notification: AdminNotificationDto,
	): Promise<{ delivered: number; failed: number }> {
		const recipients = notification.chatId
			? [notification.chatId]
			: parseTelegramAdminIds(this.config.get<string>('TELEGRAM_ADMIN_IDS'));
		if (!recipients.length) {
			throw new ServiceUnavailableException(
				'Admin Telegram destination is not configured',
			);
		}
		const markup = notification.action
			? adminUserKeyboard({
					directusUrl: directusUserUrl(
						this.config.get<string>('NEUROLUV_DIRECTUS_URL')?.trim() ||
							'https://admin.neuroluv.ru',
						notification.action.userId,
					),
					status: 'active',
					userId: notification.action.userId,
				})
			: undefined;
		const deliveries = await Promise.allSettled(
			recipients.map((recipient) =>
				this.bot.telegram.sendMessage(recipient, notification.message, {
					parse_mode: 'HTML',
					link_preview_options: { is_disabled: true },
					reply_markup: markup,
					...(notification.messageThreadId
						? { message_thread_id: notification.messageThreadId }
						: {}),
				}),
			),
		);
		const failed = deliveries.filter((result) => result.status === 'rejected');
		for (const failure of failed) {
			this.loggerService.error(
				'Не удалось доставить уведомление Telegram-администратору',
				failure,
			);
		}
		if (failed.length === deliveries.length) {
			throw new BadGatewayException('Admin notification delivery failed');
		}
		return {
			delivered: deliveries.length - failed.length,
			failed: failed.length,
		};
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

	async sendGenerationNotification(
		notification: GenerationNotificationDto,
	): Promise<{ delivered: true }> {
		const chatId = Number(notification.chatId);
		const header = generationHeader(notification);

		try {
			await this.sendGenerationBundle(
				chatId,
				header,
				notification.media,
				undefined,
				notification.prompt,
			);

			await this.sendQuotedText(chatId, 'Результат', notification.resultText);
			await this.sendQuotedText(chatId, 'Статус', notification.errorMessage);
			return { delivered: true };
		} catch (error) {
			this.loggerService.error(
				`Не удалось отправить уведомление о генерации пользователю ${chatId}`,
				error,
			);
			if (isUnreachableTelegramChat(error)) {
				throw new GoneException('Telegram chat is unavailable');
			}
			throw new BadGatewayException('Telegram delivery failed');
		}
	}

	async sendAccountNotification(
		notification: AccountNotificationDto,
	): Promise<{ delivered: true }> {
		const title =
			notification.kind === 'promo'
				? '🎁 Промокод зачислен'
				: '💰 Баланс пополнен';
		const message = [
			`<b>${title}</b>`,
			`<b>Основание:</b> ${escapeHtml(notification.label)}`,
			`<b>Начислено:</b> ${formatCredits(notification.amount)}`,
			`<b>Баланс:</b> ${formatCredits(notification.balanceAfter)}`,
			`<a href="${escapeHtml(notification.walletUrl)}">Открыть баланс</a>`,
		].join('\n');
		try {
			await this.bot.telegram.sendMessage(notification.chatId, message, {
				parse_mode: 'HTML',
				link_preview_options: { is_disabled: true },
			});
			return { delivered: true };
		} catch (error) {
			this.loggerService.error(
				`Не удалось отправить уведомление о балансе пользователю ${notification.chatId}`,
				error,
			);
			if (isUnreachableTelegramChat(error)) {
				throw new GoneException('Telegram chat is unavailable');
			}
			throw new BadGatewayException('Telegram delivery failed');
		}
	}

	async sendAdminGenerationNotification(
		notification: AdminGenerationNotificationDto,
	): Promise<{ delivered: number; failed: number }> {
		const recipients = notification.chatId
			? [notification.chatId]
			: parseTelegramAdminIds(this.config.get<string>('TELEGRAM_ADMIN_IDS'));
		if (!recipients.length) {
			throw new ServiceUnavailableException(
				'Admin Telegram destination is not configured',
			);
		}
		const header = adminGenerationHeader(notification);
		const markup = adminGenerationKeyboard({
			directusUrl:
				this.config.get<string>('NEUROLUV_DIRECTUS_URL')?.trim() ||
				'https://admin.neuroluv.ru',
			runId: notification.runId,
			userId: notification.userId,
		});
		const deliveries = await Promise.allSettled(
			recipients.map(async (recipient) => {
				await this.sendGenerationBundle(
					recipient,
					header,
					notification.media,
					notification.messageThreadId,
					notification.prompt,
					markup,
				);
				await this.sendQuotedText(
					recipient,
					'Результат',
					notification.resultText,
					notification.messageThreadId,
				);
			}),
		);
		const failed = deliveries.filter((result) => result.status === 'rejected');
		for (const failure of failed) {
			this.loggerService.error(
				'Не удалось доставить администратору успешную генерацию',
				failure,
			);
		}
		if (failed.length === deliveries.length) {
			throw new BadGatewayException('Admin generation delivery failed');
		}
		return {
			delivered: deliveries.length - failed.length,
			failed: failed.length,
		};
	}

	private async sendGenerationBundle(
		chatId: string | number,
		header: string,
		mediaItems: Array<{ type: 'photo' | 'video'; url: string }>,
		messageThreadId?: number,
		prompt?: string | null,
		replyMarkup?: InlineKeyboardMarkup,
	): Promise<void> {
		const message = messageWithPrompt(
			header,
			prompt,
			mediaItems.length ? TELEGRAM_CAPTION_LIMIT : TELEGRAM_MESSAGE_LIMIT,
		);
		if (!mediaItems.length) {
			await this.bot.telegram.sendMessage(chatId, message, {
				parse_mode: 'HTML',
				link_preview_options: { is_disabled: true },
				...(replyMarkup ? { reply_markup: replyMarkup } : {}),
				...(messageThreadId ? { message_thread_id: messageThreadId } : {}),
			});
			return;
		}

		for (const [index, media] of mediaItems.entries()) {
			const options = {
				...(index === 0
					? {
							caption: message,
							parse_mode: 'HTML' as const,
							...(replyMarkup ? { reply_markup: replyMarkup } : {}),
						}
					: {}),
				...(messageThreadId ? { message_thread_id: messageThreadId } : {}),
			};
			if (media.type === 'video') {
				await this.bot.telegram.sendVideo(
					chatId,
					Input.fromURL(media.url),
					options,
				);
			} else {
				await this.bot.telegram.sendPhoto(
					chatId,
					Input.fromURL(media.url),
					options,
				);
			}
		}
	}

	private async sendQuotedText(
		chatId: string | number,
		label: string,
		value: string | null | undefined,
		messageThreadId?: number,
	): Promise<void> {
		const normalized = value?.trim();
		if (!normalized) return;
		const chunks = splitTelegramText(normalized, 3_600);
		for (const [index, chunk] of chunks.entries()) {
			await this.bot.telegram.sendMessage(
				chatId,
				`<b>${escapeHtml(label)}${chunks.length > 1 ? ` ${index + 1}/${chunks.length}` : ''}</b>\n<blockquote>${escapeHtml(chunk)}</blockquote>`,
				{
					parse_mode: 'HTML',
					link_preview_options: { is_disabled: true },
					...(messageThreadId ? { message_thread_id: messageThreadId } : {}),
				},
			);
		}
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
			const admins = parseTelegramAdminIds(
				this.config.get<string>('TELEGRAM_ADMIN_IDS'),
			);

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

function messageWithPrompt(
	header: string,
	prompt: string | null | undefined,
	maxLength: number,
): string {
	const normalized = prompt?.trim();
	if (!normalized) return header;
	const prefix = '\n\n<b>Промпт</b>\n<blockquote expandable><code>';
	const suffix = '</code></blockquote>';
	const available = Math.max(
		0,
		maxLength - header.length - prefix.length - suffix.length,
	);
	if (available === 0) return header;
	const content = escapeHtmlWithin(normalized, available);
	return `${header}${prefix}${content}${suffix}`;
}

function escapeHtmlWithin(value: string, maxLength: number): string {
	if (maxLength <= 0) return '';
	let escaped = '';
	let truncated = false;
	const contentLimit = Math.max(0, maxLength - 1);

	for (const character of value) {
		const next = escapeHtml(character);
		if (escaped.length + next.length > contentLimit) {
			truncated = true;
			break;
		}
		escaped += next;
	}

	return truncated ? `${escaped}…` : escaped;
}

function generationHeader(notification: GenerationNotificationDto): string {
	const title =
		notification.status === 'failed'
			? '⚠️ Генерация завершилась с ошибкой'
			: notification.status === 'cancelled'
				? '⏹ Генерация отменена'
				: '✨ Генерация готова!';
	return [
		`<b>${title}</b>`,
		`<a href="${escapeHtml(notification.generationUrl)}">Открыть генерацию</a>`,
		`<b>Модель:</b> ${escapeHtml(notification.modelName)}`,
		`<b>Списано:</b> ${formatCredits(notification.creditsSpent)}`,
		`<b>Баланс:</b> ${formatCredits(notification.balanceAfter)}`,
	].join('\n');
}

function adminGenerationHeader(
	notification: AdminGenerationNotificationDto,
): string {
	const lines = [
		'✅ <b>Успешная генерация</b>',
		`<a href="${escapeHtml(notification.generationUrl)}">Открыть генерацию</a>`,
		'',
		`<b>Пользователь:</b> ${escapeHtml(notification.displayName)}`,
	];
	if (notification.email) {
		lines.push(`<b>Email:</b> ${escapeHtml(notification.email)}`);
	}
	lines.push(
		`<b>Модель:</b> ${escapeHtml(notification.modelName)}`,
		`<b>Провайдер:</b> ${escapeHtml(notification.providerType)}`,
		`<b>Списано:</b> ${formatCredits(notification.creditsSpent)}`,
		`<b>Баланс:</b> ${formatCredits(notification.balanceAfter)}`,
		`<b>Run ID:</b> <code>${escapeHtml(notification.runId)}</code>`,
		`<b>User ID:</b> <code>${escapeHtml(notification.userId)}</code>`,
	);
	return lines.join('\n');
}

function formatCredits(value: string): string {
	try {
		const credits = BigInt(value);
		const absolute = credits < 0n ? -credits : credits;
		const lastTwo = Number(absolute % 100n);
		const last = Number(absolute % 10n);
		const unit =
			lastTwo >= 11 && lastTwo <= 14
				? 'кредитов'
				: last === 1
					? 'кредит'
					: last >= 2 && last <= 4
						? 'кредита'
						: 'кредитов';
		return `${credits.toLocaleString('ru-RU')} ${unit}`;
	} catch {
		return `${escapeHtml(value)} кредитов`;
	}
}

function splitTelegramText(value: string, maxLength: number): string[] {
	const chunks: string[] = [];
	let chunk = '';
	let escapedLength = 0;

	for (const character of value) {
		const nextLength = escapeHtml(character).length;
		if (chunk && escapedLength + nextLength > maxLength) {
			chunks.push(chunk.trim());
			chunk = '';
			escapedLength = 0;
		}
		chunk += character;
		escapedLength += nextLength;
	}

	if (chunk.trim()) chunks.push(chunk.trim());
	return chunks;
}

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

function isUnreachableTelegramChat(error: unknown): boolean {
	if (!error || typeof error !== 'object') return false;
	const response =
		'response' in error ? (error as { response?: unknown }).response : null;
	if (!response || typeof response !== 'object') return false;
	const code =
		'error_code' in response
			? (response as { error_code?: unknown }).error_code
			: null;
	const description =
		'description' in response
			? (response as { description?: unknown }).description
			: null;
	return (
		code === 403 ||
		(code === 400 &&
			typeof description === 'string' &&
			/(chat not found|user is deactivated)/i.test(description))
	);
}
