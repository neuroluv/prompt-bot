import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from 'crud/messages/messages.service';
import { Telegraf } from 'telegraf';
import { ChatInviteLink } from 'telegraf/types';
import { SystemLoggerService } from '@/config';

@Injectable()
export class BotService implements OnApplicationBootstrap {
	private bot: Telegraf;
	username: string;
	private readonly CHAT_ID: string;

	constructor(
		private readonly config: ConfigService,
		private readonly loggerService: SystemLoggerService,
		private readonly messagesService: MessagesService,
	) {
		this.CHAT_ID = this.config.getOrThrow<string>(
			'TELEGRAM_PRIVATE_CHANNEL_ID',
		);
		this.loggerService.setContext(BotService.name);

		this.bot = new Telegraf(
			this.config.getOrThrow<string>('TELEGRAM_BOT_TOKEN')!,
		);
		this.username = this.config.getOrThrow('TELEGRAM_BOT_USERNAME');
	}

	get telegram() {
		return this.bot.telegram;
	}

	async onApplicationBootstrap(): Promise<void> {
		try {
			await Promise.all([
				this.bot.telegram.setMyDescription(
					'Нейролюб Studio — нейросети для текста, изображений и видео. Запускайте генерации, работайте с референсами и получайте результаты прямо в Telegram.',
				),
				this.bot.telegram.setMyShortDescription(
					'Нейросети для текста, изображений и видео в Нейролюб Studio.',
				),
			]);
		} catch (error) {
			this.loggerService.warn(
				`Не удалось обновить описание Telegram-бота: ${error instanceof Error ? error.message : 'unknown error'}`,
			);
		}
	}

	async createOnetimeInviteLink(): Promise<ChatInviteLink> {
		const invite = await this.bot.telegram.createChatInviteLink(this.CHAT_ID, {
			member_limit: 1,
			name: `Ссылка ${new Date().toLocaleDateString('ru')}`,
		});

		return invite;
	}

	async sendMessageByChatId(
		...args: Parameters<MessagesService['sendMessageByChatId']>
	) {
		return this.messagesService.sendMessageByChatId(...args);
	}

	async sendAdminMessage(
		...args: Parameters<MessagesService['sendAdminMessage']>
	) {
		return this.messagesService.sendAdminMessage(...args);
	}
}
