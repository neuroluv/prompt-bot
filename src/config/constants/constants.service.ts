import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConstantsService {
  constructor(private readonly config: ConfigService) {}

  SUPPORT_USERNAME: string = this.config.getOrThrow(
    'TELEGRAM_SUPPORT_USERNAME',
  );
}
