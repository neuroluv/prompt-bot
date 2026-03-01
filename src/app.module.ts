import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotModule } from 'bot';
import { ConstantsModule } from 'config/constants';
import { MessagesModule } from 'crud';
import { ENV_NAMES } from 'lib/common';
import { CmsModule } from './cms';
import { ChannelModule } from './crud/channel/channel.module';
import { MailingModule } from './crud/mailing/mailing.module';
import { PaymentModule } from './crud/payment/payment.module';
import { SubscriptionModule } from './crud/subscription/subscription.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: ENV_NAMES.ENV_PATH(process.env.NODE_ENV),
			isGlobal: true,
		}),
		ConstantsModule,
		BotModule,
		ChannelModule,
		MessagesModule,
		CmsModule,
		MailingModule,
		PaymentModule,
		SubscriptionModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
