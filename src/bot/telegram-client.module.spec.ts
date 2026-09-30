import { ConfigModule } from '@nestjs/config';
import { ModulesContainer } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { getBotToken } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { SystemLoggerModule } from '../config/logger/system-logger.module';
import { HealthModule } from '../crud/health/health.module';
import { MessagesModule } from '../crud/messages/messages.module';
import { MessagesService } from '../crud/messages/messages.service';
import { BotPollingService } from './bot-polling.service';
import { BotService } from './bot.service';
import { TelegramClientModule } from './telegram-client.module';

describe('Shared Telegram client', () => {
	it('creates exactly one client and poller for bot, HTTP notifications and health', async () => {
		let finish: (() => void) | undefined;
		const launch = jest
			.spyOn(Telegraf.prototype, 'launch')
			.mockImplementation(async (_options, onLaunch) => {
				onLaunch?.();
				await new Promise<void>((resolve) => {
					finish = resolve;
				});
			});
		const module = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({
					ignoreEnvFile: true,
					isGlobal: true,
					load: [
						() => ({
							TELEGRAM_BOT_TOKEN: '123456:test-token',
							TELEGRAM_BOT_USERNAME: 'test_bot',
							TELEGRAM_PRIVATE_CHANNEL_ID: '-100123456',
						}),
					],
				}),
				TelegramClientModule,
				MessagesModule,
				HealthModule,
				SystemLoggerModule,
			],
			providers: [BotService],
		}).compile();
		const bot = module.get<Telegraf>(getBotToken());
		jest.spyOn(bot.telegram, 'setMyDescription').mockResolvedValue(true);
		jest.spyOn(bot.telegram, 'setMyShortDescription').mockResolvedValue(true);
		const send = jest
			.spyOn(bot.telegram, 'sendMessage')
			.mockResolvedValue({ message_id: 1 } as never);
		bot.stop = () => finish?.();
		try {
			// forRoot must not launch in its factory, before lifecycle management.
			expect(launch).not.toHaveBeenCalled();
			const cores = [...module.get(ModulesContainer).values()].filter(
				(entry) => entry.metatype.name === 'TelegrafCoreModule',
			);
			expect(cores).toHaveLength(1);
			await module.init();
			expect(launch).toHaveBeenCalledTimes(1);
			expect(module.get(BotPollingService).status()).toEqual({
				state: 'running',
			});
			expect(module.get(BotService).telegram).toBe(bot.telegram);
			await module
				.get(MessagesService)
				.sendMessageByChatId(123456, 'test notification');
			expect(send).toHaveBeenCalledWith(
				123456,
				'test notification',
				expect.any(Object),
			);
		} finally {
			await module.close();
			jest.restoreAllMocks();
		}
	});
});
