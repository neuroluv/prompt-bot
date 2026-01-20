import { Module } from '@nestjs/common';
import { SystemLoggerModule } from 'config';
import { CmsService } from './cms.service';

@Module({
  imports: [SystemLoggerModule],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
