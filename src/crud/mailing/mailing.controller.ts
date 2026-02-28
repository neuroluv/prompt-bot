import { Body, Controller, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailingPayload } from 'lib/types/mailing';
import { MailingService } from './mailing.service';

@Controller('mailing')
export class MailingController {
	constructor(
		private readonly mailingService: MailingService,
		private readonly config: ConfigService,
	) {}

	@Post('create')
	async onMailing(@Body() body: MailingPayload) {
		this.mailingService.startInBackground(body);
		return { ok: true };
	}
}
