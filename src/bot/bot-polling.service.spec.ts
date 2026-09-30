import { Logger } from '@nestjs/common';
import type { Telegraf } from 'telegraf';
import { BotPollingService } from './bot-polling.service';

function createPolling() {
	const launch = jest.fn<
		ReturnType<Telegraf['launch']>,
		Parameters<Telegraf['launch']>
	>();
	const stop = jest.fn();
	const bot = { launch, stop } as unknown as Telegraf;
	return { service: new BotPollingService(bot), bot, launch, stop };
}

describe('BotPollingService', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
	});

	afterEach(() => {
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	it('handles Telegram 409 without rejecting bootstrap and resumes after handover', async () => {
		const { service, launch } = createPolling();
		launch.mockRejectedValueOnce({ response: { error_code: 409 } });
		launch.mockImplementationOnce(async (_options, onLaunch) => {
			onLaunch?.();
			await new Promise<void>(() => undefined);
		});

		expect(() => service.onApplicationBootstrap()).not.toThrow();
		await jest.advanceTimersByTimeAsync(0);
		expect(service.status()).toEqual({ state: 'retrying' });
		expect(Logger.prototype.warn).toHaveBeenCalledWith(
			expect.stringContaining('conflict'),
		);
		await jest.advanceTimersByTimeAsync(15_000);
		expect(launch).toHaveBeenCalledTimes(2);
		expect(service.status()).toEqual({ state: 'running' });
		service.onApplicationBootstrap();
		await jest.advanceTimersByTimeAsync(60_000);
		expect(launch).toHaveBeenCalledTimes(2);
		service.onModuleDestroy();
	});

	it('retries network failures without logging the token or payload', async () => {
		const { service, launch } = createPolling();
		launch.mockRejectedValue(
			new Error('https://api.telegram.org/bot-secret-token/getMe'),
		);
		service.onApplicationBootstrap();
		await jest.advanceTimersByTimeAsync(0);
		expect(Logger.prototype.warn).toHaveBeenCalledWith(
			'Telegram polling interrupted; retrying',
		);
		service.onModuleDestroy();
		await jest.advanceTimersByTimeAsync(30_000);
		expect(launch).toHaveBeenCalledTimes(1);
		expect(service.status()).toEqual({ state: 'stopped' });
	});

	it('stops an active poller gracefully', async () => {
		const { service, launch, stop } = createPolling();
		let finish: (() => void) | undefined;
		launch.mockImplementationOnce(async (_options, onLaunch) => {
			onLaunch?.();
			await new Promise<void>((resolve) => {
				finish = resolve;
			});
		});
		stop.mockImplementation(() => finish?.());
		service.onApplicationBootstrap();
		service.onModuleDestroy();
		await jest.advanceTimersByTimeAsync(30_000);
		expect(stop).toHaveBeenCalledWith('application shutdown');
		expect(launch).toHaveBeenCalledTimes(1);
		expect(service.status()).toEqual({ state: 'stopped' });
	});

	it('does not start polling when getMe finishes after shutdown', async () => {
		const { service, launch, stop } = createPolling();
		let ready: (() => void) | undefined;
		let pollingStarted = false;
		launch.mockImplementationOnce(async (_options, onLaunch) => {
			await new Promise<void>((resolve) => {
				ready = resolve;
			});
			onLaunch?.();
			pollingStarted = true;
		});
		stop.mockImplementation(() => {
			throw new Error('Bot is not running!');
		});
		service.onApplicationBootstrap();
		expect(() => service.onModuleDestroy()).not.toThrow();
		ready?.();
		await jest.advanceTimersByTimeAsync(0);
		expect(pollingStarted).toBe(false);
		expect(service.status()).toEqual({ state: 'stopped' });
	});

	it('makes lifecycle stop idempotent but does not hide unexpected stop errors', () => {
		const { service, bot, stop } = createPolling();
		stop.mockImplementation(() => {
			throw new Error('Bot is not running!');
		});
		expect(() => service.onModuleDestroy()).not.toThrow();
		expect(() => bot.stop()).not.toThrow();
		stop.mockImplementation(() => {
			throw new Error('Unexpected shutdown failure');
		});
		expect(() => bot.stop()).toThrow('Unexpected shutdown failure');
	});
});
