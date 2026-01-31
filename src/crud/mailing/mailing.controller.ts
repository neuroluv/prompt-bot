import { Body, Controller, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailingService } from './mailing.service';
import { MailingPayload } from 'lib/types/mailing';

@Controller('mailing')
export class MailingController {
  constructor(
    private readonly mailingService: MailingService,
    private readonly config: ConfigService,
  ) {}

  @Post('create')
  async onMailing(@Body() body: MailingPayload) {
    this.mailingService.startInBackground(body);
    return { ok: true };
  }
}
