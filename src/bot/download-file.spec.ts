import type { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';
import type { Context } from 'telegraf';
import { BotUpdate } from './bot.update';

describe('private prompt file delivery', () => {
	function fixture(failSend = false) {
		const stream = Readable.from(['PDF']);
		const cms = {
			getPromptFileByName: jest.fn().mockResolvedValue({
				id: 1,
				title: 'Сборник',
				file: { id: 'file-id', filename_download: 'Сборник.pdf' },
			}),
			getDirectusFileStream: jest.fn().mockResolvedValue(stream),
			upsertUser: jest.fn().mockResolvedValue({ id: 5 }),
			createPromptFileStats: jest.fn(),
		};
		const ctx = {
			callbackQuery: { data: 'download-file-prompts50' },
			from: { id: 123 },
			chat: { id: 123 },
			reply: jest.fn().mockResolvedValue({ message_id: 1 }),
			replyWithDocument: failSend
				? jest.fn().mockRejectedValue(new Error('Telegram unavailable'))
				: jest.fn().mockResolvedValue({ message_id: 2 }),
			deleteMessage: jest.fn().mockResolvedValue(true),
		} as unknown as Context;
		const update = new BotUpdate(
			{} as never,
			{ log: jest.fn(), error: jest.fn() } as never,
			cms as never,
			{} as never,
			{} as never,
			{ get: () => undefined } as unknown as ConfigService,
			{} as never,
		);
		return { update, cms, ctx, stream };
	}
	it('sends the authenticated stream, preserves the filename and records the download', async () => {
		const { update, cms, ctx, stream } = fixture();
		await update.downloadFile(ctx);
		expect(cms.getDirectusFileStream).toHaveBeenCalledWith('file-id');
		expect(ctx.replyWithDocument).toHaveBeenCalledWith(
			{ source: stream, filename: 'Сборник.pdf' },
			expect.any(Object),
		);
		expect(cms.createPromptFileStats).toHaveBeenCalledWith(5, 1, 'Сборник');
		expect(stream.destroyed).toBe(true);
		expect(ctx.deleteMessage).toHaveBeenCalledWith(1);
	});
	it('closes the CMS connection and clears loading even if Telegram rejects the send', async () => {
		const { update, cms, ctx, stream } = fixture(true);
		await expect(update.downloadFile(ctx)).rejects.toThrow(
			'Telegram unavailable',
		);
		expect(stream.destroyed).toBe(true);
		expect(ctx.deleteMessage).toHaveBeenCalledWith(1);
		expect(cms.createPromptFileStats).not.toHaveBeenCalled();
	});
});
