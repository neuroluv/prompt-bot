import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotModule } from 'bot';
import { MessagesModule } from 'crud';
import { ENV_NAMES } from 'lib/common';
import { CmsModule } from './cms/cms.module';
import { ChannelModule } from './crud/channel/channel.module';
import { MailingModule } from './crud/mailing/mailing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ENV_NAMES.ENV_PATH(process.env.NODE_ENV),
      isGlobal: true,
    }),
    BotModule,
    ChannelModule,
    MessagesModule,
    CmsModule,
    MailingModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
