import {
	Body,
	Controller,
	Param,
	Post,
	UseGuards,
	UsePipes,
	ValidationPipe,
} from '@nestjs/common';
import { ICustomMessage } from 'lib/types';
import { AdminNotificationDto } from './dto/admin-notification.dto';
import { GenerationNotificationDto } from './dto/generation-notification.dto';
import { InternalTokenGuard } from './internal-token.guard';
import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(InternalTokenGuard)
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

@Controller('notifications')
@UseGuards(InternalTokenGuard)
export class NotificationsController {
	constructor(private readonly messagesService: MessagesService) {}

	@Post('admin')
	@UsePipes(
		new ValidationPipe({
			forbidNonWhitelisted: true,
			transform: true,
			whitelist: true,
		}),
	)
	sendAdminMessage(@Body() dto: AdminNotificationDto) {
		return this.messagesService.sendAdminNotification(dto);
	}

	@Post('generation')
	@UsePipes(
		new ValidationPipe({
			forbidNonWhitelisted: true,
			transform: true,
			whitelist: true,
		}),
	)
	sendGeneration(@Body() dto: GenerationNotificationDto) {
		return this.messagesService.sendGenerationNotification(dto);
	}
}
