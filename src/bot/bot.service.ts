import { SystemLoggerService } from '@/config';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

@Injectable()
export class BotService {
  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: SystemLoggerService,
  ) {
    this.loggerService.setContext(BotService.name);
  }

  getPhotoFile(filename: string) {
    return join(__dirname, '..', '..', 'files', filename);
  }

  getPromptFilePath(promptsCount: string) {
    return join(__dirname, '..', '..', 'files', `prompts${promptsCount}.pdf`);
  }
}
