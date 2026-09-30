import { Controller, Get } from '@nestjs/common';
import { BotPollingService } from 'bot/bot-polling.service';

@Controller('health')
export class HealthController {
	constructor(private readonly polling: BotPollingService) {}
	@Get()
	health() {
		return { ok: true, ts: Date.now(), polling: this.polling.status() };
	}
}
