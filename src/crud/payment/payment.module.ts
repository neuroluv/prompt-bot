import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BotModule } from 'bot';
import { CmsModule } from 'cms';
import { SystemLoggerModule } from 'config';
import { CryptoBotPaymentService } from './cryptobot-payment.service';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { YookassaPaymentService } from './yookassa-payment.service';
import { SubscriptionModule } from 'crud/subscription';

@Module({
  imports: [
    CmsModule,
    SystemLoggerModule,
    SubscriptionModule,
    forwardRef(() => BotModule),
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    YookassaPaymentService,
    CryptoBotPaymentService,
    ConfigService,
  ],
  exports: [PaymentService, YookassaPaymentService, CryptoBotPaymentService],
})
export class PaymentModule {}
