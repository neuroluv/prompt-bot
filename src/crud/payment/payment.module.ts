import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BotModule } from 'bot';
import { CmsModule } from 'cms';
import { SystemLoggerModule } from 'config';
import { ConstantsModule } from 'config/constants';
import { SubscriptionModule } from 'crud/subscription';
import { PaymentService } from './payment.service';
import { ReceiptService } from './receipt.service';

@Module({
	imports: [
		CmsModule,
		SystemLoggerModule,
		SubscriptionModule,
		ConstantsModule,
		forwardRef(() => BotModule),
	],
	providers: [PaymentService, ConfigService, ReceiptService],
	exports: [PaymentService, ReceiptService],
})
export class PaymentModule {}
