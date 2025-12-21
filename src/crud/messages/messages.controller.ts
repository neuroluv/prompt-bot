import { Body, Controller, Param, Post } from '@nestjs/common';
import { ICustomMessage } from 'lib/types';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post(':id')
  sendMessageUserByChatId(
    @Param('id') chatId: string,
    @Body() dto: ICustomMessage,
  ) {
    return this.messagesService.sendMessageByChatId(+chatId, dto.message);
  }
}
