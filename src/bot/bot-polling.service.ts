import {
	Injectable,
	Logger,
	type OnApplicationBootstrap,
	type OnModuleDestroy,
} from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import type { Telegraf } from 'telegraf';

@Injectable()
export class BotPollingService
	implements OnApplicationBootstrap, OnModuleDestroy
{
	private readonly logger = new Logger(BotPollingService.name);
	private started = false;
	private stopping = false;
	private state: 'starting' | 'running' | 'retrying' | 'stopped' = 'starting';
	private timer: ReturnType<typeof setTimeout> | undefined;
	private wake: (() => void) | undefined;

	constructor(@InjectBot() private readonly bot: Telegraf) {
		// nestjs-telegraf also calls stop during shutdown. Standby/retrying bots have
		// no running poller, so stopping must be idempotent across lifecycle hooks.
		const stop = bot.stop.bind(bot);
		bot.stop = (reason?: string) => {
			try {
				stop(reason);
			} catch (error) {
				if (
					!(error instanceof Error) ||
					!/bot is not running/iu.test(error.message)
				)
					throw error;
			}
		};
	}

	onApplicationBootstrap(): void {
		if (this.started || this.stopping) return;
		this.started = true;
		void this.poll().catch(() => {
			this.state = 'stopped';
			this.logger.error('Telegram polling loop stopped unexpectedly');
		});
	}

	onModuleDestroy(): void {
		this.stopping = true;
		this.state = 'stopped';
		if (this.timer) clearTimeout(this.timer);
		this.wake?.();
		this.bot.stop('application shutdown');
	}

	status() {
		return { state: this.state };
	}

	private async poll(): Promise<void> {
		while (!this.stopping) {
			this.state = 'starting';
			try {
				await this.bot.launch({}, () => {
					// launch invokes this before creating the poller. Prevent a late
					// getMe response from starting polling after application shutdown.
					if (this.stopping)
						throw new Error('Telegram polling startup cancelled');
					this.state = 'running';
				});
				if (this.stopping) this.bot.stop('application shutdown');
			} catch (error) {
				if (this.stopping) return;
				const code = telegramErrorCode(error);
				this.logger.warn(
					code === 409
						? 'Telegram polling conflict: another instance is active; waiting for deployment handover'
						: `Telegram polling interrupted${code ? ` (API ${code})` : ''}; retrying`,
				);
			}
			if (this.stopping) return;
			this.state = 'retrying';
			await new Promise<void>((resolve) => {
				this.wake = resolve;
				// Keep HTTP delivery/health alive while the old Swarm task stops.
				this.timer = setTimeout(resolve, 15_000);
			});
			this.wake = undefined;
			this.timer = undefined;
		}
	}
}

function telegramErrorCode(error: unknown): number | null {
	if (!error || typeof error !== 'object' || !('response' in error))
		return null;
	const response = error.response;
	if (!response || typeof response !== 'object' || !('error_code' in response))
		return null;
	return typeof response.error_code === 'number' ? response.error_code : null;
}
