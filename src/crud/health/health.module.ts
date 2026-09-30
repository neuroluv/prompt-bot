import { Module } from '@nestjs/common';
import { TelegramClientModule } from '../../bot/telegram-client.module';
import { HealthController } from './health.controller';

@Module({
	imports: [TelegramClientModule],
	controllers: [HealthController],
})
export class HealthModule {}
