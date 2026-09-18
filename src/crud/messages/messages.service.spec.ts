import { ConfigService } from '@nestjs/config';
import { SystemLoggerService } from 'config';
import { Context, Telegraf } from 'telegraf';
import { MessagesService } from './messages.service';

describe('MessagesService generation notifications', () => {
	it('attaches video and keeps the hidden copyable prompt in the same caption', async () => {
		const sendVideo = jest.fn().mockResolvedValue({ message_id: 1 });
		const sendMessage = jest.fn().mockResolvedValue({ message_id: 2 });
		const bot = {
			telegram: { sendMessage, sendPhoto: jest.fn(), sendVideo },
		} as unknown as Telegraf<Context>;
		const logger = {
			setContext: jest.fn(),
			error: jest.fn(),
		} as unknown as SystemLoggerService;
		const service = new MessagesService(bot, logger, config());

		await service.sendGenerationNotification({
			chatId: '123456',
			status: 'succeeded',
			modelName: 'Kling 2.6',
			generationUrl: 'https://neuroluv.ru/ai/works/example',
			prompt: 'Перенеси <движение> на фото',
			resultText: 'Готовый текст & описание',
			errorMessage: null,
			creditsSpent: '12',
			balanceAfter: '88',
			media: [{ type: 'video', url: 'https://cdn.example.test/generated.mp4' }],
		});

		expect(sendVideo).toHaveBeenCalledWith(
			123456,
			expect.anything(),
			expect.objectContaining({
				caption: expect.stringContaining(
					'<blockquote expandable><code>Перенеси &lt;движение&gt; на фото</code></blockquote>',
				),
				parse_mode: 'HTML',
			}),
		);
		expect(sendMessage).toHaveBeenCalledTimes(1);
		expect(sendMessage.mock.calls[0]?.[1]).toContain(
			'<blockquote>Готовый текст &amp; описание</blockquote>',
		);
	});

	it('splits quoted text by escaped Telegram HTML length', async () => {
		const sendMessage = jest.fn().mockResolvedValue({ message_id: 1 });
		const bot = {
			telegram: { sendMessage, sendPhoto: jest.fn(), sendVideo: jest.fn() },
		} as unknown as Telegraf<Context>;
		const logger = {
			setContext: jest.fn(),
			error: jest.fn(),
		} as unknown as SystemLoggerService;
		const service = new MessagesService(bot, logger, config());

		await service.sendGenerationNotification({
			chatId: '123456',
			status: 'succeeded',
			modelName: 'Text model',
			generationUrl: 'https://neuroluv.ru/ai/works/example',
			prompt: null,
			resultText: '&'.repeat(4_000),
			errorMessage: null,
			creditsSpent: '2',
			balanceAfter: '98',
			media: [],
		});

		expect(sendMessage.mock.calls.length).toBeGreaterThan(2);
		for (const [, message] of sendMessage.mock.calls) {
			expect(String(message).length).toBeLessThanOrEqual(4_096);
		}
	});

	it('fans an actionable registration notification out to every configured admin', async () => {
		const sendMessage = jest.fn().mockResolvedValue({ message_id: 1 });
		const bot = {
			telegram: { sendMessage, sendPhoto: jest.fn(), sendVideo: jest.fn() },
		} as unknown as Telegraf<Context>;
		const logger = {
			setContext: jest.fn(),
			error: jest.fn(),
		} as unknown as SystemLoggerService;
		const service = new MessagesService(
			bot,
			logger,
			config({ TELEGRAM_ADMIN_IDS: '123, 456,123' }),
		);

		const result = await service.sendAdminNotification({
			message: '<b>Новая регистрация</b>',
			action: {
				type: 'user_registration',
				userId: 'aad6cb91-05e7-436a-bf39-0de194ac9606',
			},
		});

		expect(result).toEqual({ delivered: 2, failed: 0 });
		expect(sendMessage).toHaveBeenCalledTimes(2);
		expect(sendMessage.mock.calls.map(([chatId]) => chatId)).toEqual([
			123, 456,
		]);
		expect(sendMessage.mock.calls[0]?.[2]?.reply_markup).toEqual(
			expect.objectContaining({
				inline_keyboard: expect.arrayContaining([
					expect.arrayContaining([
						expect.objectContaining({ text: '🚫 Заблокировать' }),
					]),
				]),
			}),
		);
		expect(
			sendMessage.mock.calls[0]?.[2]?.reply_markup?.inline_keyboard[1]?.[0],
		).toEqual({
			text: '👤 Открыть в Directus',
			url: 'https://admin.neuroluv.test/admin/content/ai_users/aad6cb91-05e7-436a-bf39-0de194ac9606',
		});
	});

	it('routes an admin notification to a configured Telegram topic', async () => {
		const sendMessage = jest.fn().mockResolvedValue({ message_id: 1 });
		const bot = {
			telegram: { sendMessage, sendPhoto: jest.fn(), sendVideo: jest.fn() },
		} as unknown as Telegraf<Context>;
		const logger = {
			setContext: jest.fn(),
			error: jest.fn(),
		} as unknown as SystemLoggerService;
		const service = new MessagesService(bot, logger, config());

		await service.sendAdminNotification({
			chatId: '-1001234567890',
			messageThreadId: 321,
			message: '<b>Баланс пополнен</b>',
		});

		expect(sendMessage).toHaveBeenCalledTimes(1);
		expect(sendMessage).toHaveBeenCalledWith(
			'-1001234567890',
			'<b>Баланс пополнен</b>',
			expect.objectContaining({ message_thread_id: 321 }),
		);
	});

	it('attaches generated media to the admin generation topic', async () => {
		const sendPhoto = jest.fn().mockResolvedValue({ message_id: 1 });
		const sendMessage = jest.fn().mockResolvedValue({ message_id: 2 });
		const bot = {
			telegram: { sendMessage, sendPhoto, sendVideo: jest.fn() },
		} as unknown as Telegraf<Context>;
		const logger = {
			setContext: jest.fn(),
			error: jest.fn(),
		} as unknown as SystemLoggerService;
		const service = new MessagesService(bot, logger, config());

		await service.sendAdminGenerationNotification({
			chatId: '-1001234567890',
			messageThreadId: 777,
			runId: 'e345b959-e917-4b00-9e6e-713b7cc58952',
			userId: 'b9a69061-d5db-4c79-9496-e36fd3ef3060',
			displayName: 'Пользователь',
			email: 'user@example.test',
			modelName: 'Nano Banana',
			providerType: 'kie',
			generationUrl: 'https://neuroluv.ru/ai/works/example',
			prompt: 'Нарисуй кота',
			resultText: null,
			creditsSpent: '8',
			balanceAfter: '92',
			media: [
				{ type: 'photo', url: 'https://cdn.example.test/generated.webp' },
			],
		});

		expect(sendPhoto).toHaveBeenCalledWith(
			'-1001234567890',
			expect.anything(),
			expect.objectContaining({
				caption: expect.stringContaining(
					'<blockquote expandable><code>Нарисуй кота</code></blockquote>',
				),
				message_thread_id: 777,
			}),
		);
		expect(sendMessage).not.toHaveBeenCalled();
	});

	it('truncates a long prompt inside the Telegram caption limit without a second prompt message', async () => {
		const sendPhoto = jest.fn().mockResolvedValue({ message_id: 1 });
		const sendMessage = jest.fn().mockResolvedValue({ message_id: 2 });
		const bot = {
			telegram: { sendMessage, sendPhoto, sendVideo: jest.fn() },
		} as unknown as Telegraf<Context>;
		const logger = {
			setContext: jest.fn(),
			error: jest.fn(),
		} as unknown as SystemLoggerService;
		const service = new MessagesService(bot, logger, config());

		await service.sendGenerationNotification({
			chatId: '123456',
			status: 'succeeded',
			modelName: 'Image model',
			generationUrl: 'https://neuroluv.ru/ai/works/example',
			prompt: '<hero>&'.repeat(2_000),
			resultText: null,
			errorMessage: null,
			creditsSpent: '3',
			balanceAfter: '97',
			media: [
				{ type: 'photo', url: 'https://cdn.example.test/generated.webp' },
			],
		});

		const caption = String(sendPhoto.mock.calls[0]?.[2]?.caption);
		const visibleCaption = caption
			.replace(/<[^>]*>/g, '')
			.replace(/&(?:amp|lt|gt|quot);/g, 'x');
		expect(visibleCaption.length).toBeLessThanOrEqual(1_024);
		expect(caption).toContain('<blockquote expandable><code>');
		expect(caption).toContain('…</code></blockquote>');
		expect(sendMessage).not.toHaveBeenCalled();
	});
});

function config(values: Record<string, string> = {}): ConfigService {
	const environment = {
		CMS_URL: 'https://legacy-cms.neuroluv.test',
		NEUROLUV_DIRECTUS_URL: 'https://admin.neuroluv.test',
		TELEGRAM_ADMIN_IDS: '123',
		...values,
	};
	return {
		get: (key: string) => environment[key],
		getOrThrow: (key: string) => {
			const value = environment[key];
			if (!value) throw new Error(`Missing ${key}`);
			return value;
		},
	} as ConfigService;
}
