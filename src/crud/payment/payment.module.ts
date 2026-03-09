import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BotModule } from 'bot';
import { CmsModule } from 'cms';
import { SystemLoggerModule } from 'config';
import { ConstantsModule } from 'config/constants';
import { SubscriptionModule } from 'crud/subscription';
import { CryptoBotPaymentService } from './cryptobot-payment.service';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ReceiptService } from './receipt.service';
import { YookassaPaymentService } from './yookassa-payment.service';

@Module({
	imports: [
		CmsModule,
		SystemLoggerModule,
		SubscriptionModule,
		ConstantsModule,
		forwardRef(() => BotModule),
	],
	controllers: [PaymentController],
	providers: [
		PaymentService,
		YookassaPaymentService,
		CryptoBotPaymentService,
		ConfigService,
		ReceiptService,
	],
	exports: [
		PaymentService,
		YookassaPaymentService,
		CryptoBotPaymentService,
		ReceiptService,
	],
})
export class PaymentModule {}
