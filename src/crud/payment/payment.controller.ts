import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { SystemLoggerService } from 'config';
import type { YooKassaNotification } from 'lib/types';
import type { ICryptoPayUpdate } from 'lib/types/crypto-bot';
import { YookassaWebhook } from 'nestjs-yookassa';
import { CryptoBotPaymentService } from './cryptobot-payment.service';
import { YookassaPaymentService } from './yookassa-payment.service';

@Controller('payment')
export class PaymentController {
	constructor(
		private readonly logger: SystemLoggerService,
		private readonly yookassaPaymentService: YookassaPaymentService,
		private readonly cryptoBotPaymentService: CryptoBotPaymentService,
	) {
		this.logger.setContext(PaymentController.name);
	}

	@Post('notification')
	@YookassaWebhook()
	@HttpCode(200)
	async getNotifications(@Body() body: YooKassaNotification<unknown>) {
		void this.yookassaPaymentService.processNotificationSafely(body);

		return { status: 'ok' };
	}

	@Post('crypto-notification')
	@HttpCode(200)
	async getCryptoNotifications(@Body() body: ICryptoPayUpdate) {
		void this.cryptoBotPaymentService.processNotificationSafely(body);
		return { status: 'ok' };
	}
}
