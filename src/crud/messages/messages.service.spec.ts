import { SystemLoggerService } from 'config';
import { Context, Telegraf } from 'telegraf';
import { MessagesService } from './messages.service';

describe('MessagesService generation notifications', () => {
	it('attaches video and sends prompt/result as Telegram quotes', async () => {
		const sendVideo = jest.fn().mockResolvedValue({ message_id: 1 });
		const sendMessage = jest.fn().mockResolvedValue({ message_id: 2 });
		const bot = {
			telegram: { sendMessage, sendPhoto: jest.fn(), sendVideo },
		} as unknown as Telegraf<Context>;
		const logger = {
			setContext: jest.fn(),
			error: jest.fn(),
		} as unknown as SystemLoggerService;
		const service = new MessagesService(bot, logger);

		await service.sendGenerationNotification({
			chatId: '123456',
			status: 'succeeded',
			modelName: 'Kling 2.6',
			generationUrl: 'https://neuroluv.ru/ai/works/example',
			prompt: 'Перенеси <движение> на фото',
			resultText: 'Готовый текст & описание',
			errorMessage: null,
			media: [{ type: 'video', url: 'https://cdn.example.test/generated.mp4' }],
		});

		expect(sendVideo).toHaveBeenCalledWith(
			123456,
			expect.anything(),
			expect.objectContaining({
				caption: expect.stringContaining('Генерация готова'),
				parse_mode: 'HTML',
			}),
		);
		expect(sendMessage).toHaveBeenCalledTimes(2);
		expect(sendMessage.mock.calls[0]?.[1]).toContain(
			'<blockquote>Перенеси &lt;движение&gt; на фото</blockquote>',
		);
		expect(sendMessage.mock.calls[1]?.[1]).toContain(
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
		const service = new MessagesService(bot, logger);

		await service.sendGenerationNotification({
			chatId: '123456',
			status: 'succeeded',
			modelName: 'Text model',
			generationUrl: 'https://neuroluv.ru/ai/works/example',
			prompt: null,
			resultText: '&'.repeat(4_000),
			errorMessage: null,
			media: [],
		});

		expect(sendMessage.mock.calls.length).toBeGreaterThan(2);
		for (const [, message] of sendMessage.mock.calls) {
			expect(String(message).length).toBeLessThanOrEqual(4_096);
		}
	});
});
