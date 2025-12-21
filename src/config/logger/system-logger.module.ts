import { Module } from '@nestjs/common';
import { SystemLoggerService } from './system-logger.service';

@Module({
  providers: [SystemLoggerService],
  exports: [SystemLoggerService],
})
export class SystemLoggerModule {}
