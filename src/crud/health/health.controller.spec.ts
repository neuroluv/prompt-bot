import type { BotPollingService } from 'bot/bot-polling.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
	it('reports IP-blocking support and the live polling state', () => {
		const polling = {
			status: jest.fn().mockReturnValue({ state: 'running' }),
		} as unknown as BotPollingService;
		const controller = new HealthController(polling);
		expect(controller.health()).toEqual({
			ok: true,
			ts: expect.any(Number),
			polling: { state: 'running' },
			capabilities: { registrationIpBlocking: true },
		});
	});
});
