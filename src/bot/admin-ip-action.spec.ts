import type { ConfigService } from '@nestjs/config';
import type { Context } from 'telegraf';
import type { StudioAdminUsersService } from './admin-users.service';
import { BotUpdate } from './bot.update';

describe('registration IP admin action', () => {
	const userId = 'aad6cb91-05e7-436a-bf39-0de194ac9606';
	function fixture(sender: number, action: string) {
		const service = {
			registrationIp: jest.fn().mockResolvedValue({
				available: true,
				blocked: false,
				expiresAt: null,
				accounts: 3,
			}),
			blockRegistrationIp: jest.fn().mockResolvedValue({
				blocked: true,
				blockedAccounts: 3,
				revokedSessions: 4,
			}),
			unblockRegistrationIp: jest.fn(),
		};
		const update = new BotUpdate(
			{} as never,
			{ error: jest.fn() } as never,
			{} as never,
			{} as never,
			{} as never,
			{
				get: (key: string) =>
					key === 'TELEGRAM_ADMIN_IDS' ? '123,456' : undefined,
			} as unknown as ConfigService,
			service as unknown as StudioAdminUsersService,
		);
		const ctx = {
			from: { id: sender },
			chat: { id: -100123 },
			callbackQuery: {
				data: `admin_ip:${action}:${userId}`,
				message: { message_thread_id: 17 },
			},
			answerCbQuery: jest.fn(),
			reply: jest.fn(),
		} as unknown as Context;
		return { service, ctx, update };
	}
	it('rejects non-admins even when they forge a confirm callback', async () => {
		const { service, ctx, update } = fixture(999, 'block:forever');
		await update.registrationIpAction(ctx);
		expect(service.blockRegistrationIp).not.toHaveBeenCalled();
		expect(service.registrationIp).not.toHaveBeenCalled();
		expect(ctx.answerCbQuery).toHaveBeenCalledWith('Недостаточно прав', {
			show_alert: true,
		});
	});
	it('shows confirmation without modifying anything on the duration selection', async () => {
		const { service, ctx, update } = fixture(123, 'choose:7');
		await update.registrationIpAction(ctx);
		expect(service.blockRegistrationIp).not.toHaveBeenCalled();
		expect(ctx.reply).toHaveBeenCalledWith(
			expect.stringContaining('Подтвердите'),
			expect.objectContaining({ message_thread_id: 17 }),
		);
	});
	it('allows every configured administrator to confirm a permanent ban', async () => {
		const { service, ctx, update } = fixture(456, 'block:forever');
		await update.registrationIpAction(ctx);
		expect(service.blockRegistrationIp).toHaveBeenCalledWith(userId, 456, null);
	});
});
