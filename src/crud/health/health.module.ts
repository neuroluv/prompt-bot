import { Module } from '@nestjs/common';
import { BotModule } from 'bot';
import { HealthController } from './health.controller';

@Module({
	imports: [BotModule],
	controllers: [HealthController],
})
export class HealthModule {}
