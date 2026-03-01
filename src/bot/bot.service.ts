import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from 'crud';
import { Telegraf } from 'telegraf';
import { ChatInviteLink } from 'telegraf/types';
import { SystemLoggerService } from '@/config';

@Injectable()
export class BotService {
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

	async createOnetimeInviteLink(): Promise<ChatInviteLink> {
		const invite = await this.bot.telegram.createChatInviteLink(this.CHAT_ID, {
			member_limit: 1,
		});

		return invite;
	}

	sendMessageByChatId = this.messagesService.sendMessageByChatId;
}
