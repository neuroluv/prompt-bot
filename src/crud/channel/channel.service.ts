import { Injectable } from '@nestjs/common';
import { channelsKeyboard } from 'bot/keyboards';
import { mainMessages } from 'bot/messages';
import { SystemLoggerService } from 'config';
import { CHANNELS_LINKS, GOOD_MEMBER_STATUSES } from 'lib/common';
import { join } from 'path';
import { Context, Input } from 'telegraf';

@Injectable()
export class ChannelService {
	constructor(private readonly loggerService: SystemLoggerService) {
		this.loggerService.setContext(ChannelService.name);
	}

	// Проверка подписки пользователя на все обязательные каналы
	async isUserSubs(ctx: Context): Promise<boolean> {
		if (!ctx.from?.id) {
			return false;
		}

		try {
			const subscriptionStatuses = await Promise.all(
				CHANNELS_LINKS.map(async (channel) => {
					try {
						const member = await ctx.telegram.getChatMember(
							channel.chatId,
							ctx.from.id,
						);

						return GOOD_MEMBER_STATUSES.includes(member.status);
					} catch (error) {
						this.loggerService.error(
							`Не удалось проверить подписку на канал «${channel.label}»: ${String(error)}`,
							ChannelService.name,
						);
						return false;
					}
				}),
			);

			const isSubscribedToAll = subscriptionStatuses.every(Boolean);
			if (!isSubscribedToAll) {
				await ctx.replyWithPhoto(
					Input.fromLocalFile(
						join(__dirname, '..', '..', '..', 'files', 'error_cat.jpeg'),
					),
					{
						caption: mainMessages.needSubscribe,
						parse_mode: 'HTML',
						reply_markup: {
							inline_keyboard: channelsKeyboard(),
						},
					},
				);
			}

			return isSubscribedToAll;
		} catch (error) {
			this.loggerService.error(error, ChannelService.name);
			return false;
		}
	}
}
