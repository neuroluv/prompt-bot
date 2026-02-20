import type { YooKassaNotification } from 'lib/types';
import type { ICryptoPayUpdate } from 'lib/types/crypto-bot';
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { SystemLoggerService } from 'config';
import { YookassaPaymentService } from './yookassa-payment.service';
import { CryptoBotPaymentService } from './cryptobot-payment.service';

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly logger: SystemLoggerService,
    private readonly yookassaPaymentService: YookassaPaymentService,
    private readonly cryptoBotPaymentService: CryptoBotPaymentService,
  ) {
    this.logger.setContext(PaymentController.name);
  }

  @Post('neuroluv-club')
  async createPayment(telegramId: number | bigint) {
    return this.yookassaPaymentService.create(telegramId);
  }

  @Post('notification')
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
