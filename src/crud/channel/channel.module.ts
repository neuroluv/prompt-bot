import { Module } from '@nestjs/common';
import { SystemLoggerModule } from 'config';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';

@Module({
	imports: [SystemLoggerModule],
	controllers: [ChannelController],
	providers: [ChannelService],
})
export class ChannelModule {}
