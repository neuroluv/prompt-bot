import { Test } from '@nestjs/testing';
import { getBotToken, Start, TelegrafModule, Update } from 'nestjs-telegraf';
import type { Telegraf } from 'telegraf';

@Update()
class CompatibilityUpdate {
	started = false;

	@Start()
	onStart() {
		this.started = true;
	}
}

describe('Nest Telegram adapter compatibility', () => {
	it('discovers and executes decorated handlers with Nest 12 without launching Telegram', async () => {
		const module = await Test.createTestingModule({
			imports: [
				TelegrafModule.forRoot({
					token: '123456:test-token',
					launchOptions: false,
				}),
			],
			providers: [CompatibilityUpdate],
		}).compile();
		const bot = module.get<Telegraf>(getBotToken());
		bot.botInfo = {
			id: 123456,
			is_bot: true,
			first_name: 'Test bot',
			username: 'test_bot',
			can_join_groups: false,
			can_read_all_group_messages: false,
			supports_inline_queries: false,
		};
		bot.stop = jest.fn();
		try {
			await module.init();
			await bot.handleUpdate({
				update_id: 1,
				message: {
					message_id: 1,
					date: 1,
					chat: { id: 1, type: 'private', first_name: 'Test user' },
					from: { id: 1, is_bot: false, first_name: 'Test user' },
					text: '/start',
					entities: [{ type: 'bot_command', offset: 0, length: 6 }],
				},
			});
			expect(module.get(CompatibilityUpdate).started).toBe(true);
		} finally {
			await module.close();
		}
	});
});
