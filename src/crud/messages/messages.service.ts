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
import {
	adminUserKeyboard,
	directusUserUrl,
} from '../../bot/keyboards/admin-user.keyboard';
import type { AdminNotificationDto } from './dto/admin-notification.dto';
import type { GenerationNotificationDto } from './dto/generation-notification.dto';

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
		private readonly config: ConfigService,
	) {
		this.loggerService.setContext(MessagesService.name);
	}

	async sendAdminNotification(
		notification: AdminNotificationDto,
	): Promise<{ delivered: number; failed: number }> {
		const admins = parseTelegramAdminIds(
			this.config.get<string>('TELEGRAM_ADMIN_IDS'),
		);
		if (!admins.length) {
			throw new ServiceUnavailableException(
				'TELEGRAM_ADMIN_IDS is not configured',
			);
		}
		const markup = notification.action
			? adminUserKeyboard({
					directusUrl: directusUserUrl(
						this.config.getOrThrow<string>('CMS_URL'),
						notification.action.userId,
					),
					status: 'active',
					userId: notification.action.userId,
				})
			: undefined;
		const deliveries = await Promise.allSettled(
			admins.map((admin) =>
				this.bot.telegram.sendMessage(admin, notification.message, {
					parse_mode: 'HTML',
					link_preview_options: { is_disabled: true },
					reply_markup: markup,
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
			if (notification.media.length) {
				for (const [index, media] of notification.media.entries()) {
					const options =
						index === 0
							? { caption: header, parse_mode: 'HTML' as const }
							: undefined;
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
			} else {
				await this.bot.telegram.sendMessage(chatId, header, {
					parse_mode: 'HTML',
					link_preview_options: { is_disabled: true },
				});
			}

			await this.sendQuotedText(chatId, 'Промпт', notification.prompt);
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

	private async sendQuotedText(
		chatId: number,
		label: string,
		value: string | null | undefined,
	): Promise<void> {
		const normalized = value?.trim();
		if (!normalized) return;
		const chunks = splitTelegramText(normalized, 3_600);
		for (const [index, chunk] of chunks.entries()) {
			await this.bot.telegram.sendMessage(
				chatId,
				`<b>${escapeHtml(label)}${chunks.length > 1 ? ` ${index + 1}/${chunks.length}` : ''}</b>\n<blockquote>${escapeHtml(chunk)}</blockquote>`,
				{ parse_mode: 'HTML', link_preview_options: { is_disabled: true } },
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
	].join('\n');
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
