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
import { AccountNotificationDto } from './dto/account-notification.dto';
import { AdminGenerationNotificationDto } from './dto/admin-generation-notification.dto';
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

	@Post('account')
	@UsePipes(
		new ValidationPipe({
			forbidNonWhitelisted: true,
			transform: true,
			whitelist: true,
		}),
	)
	sendAccount(@Body() dto: AccountNotificationDto) {
		return this.messagesService.sendAccountNotification(dto);
	}

	@Post('admin-generation')
	@UsePipes(
		new ValidationPipe({
			forbidNonWhitelisted: true,
			transform: true,
			whitelist: true,
		}),
	)
	sendAdminGeneration(@Body() dto: AdminGenerationNotificationDto) {
		return this.messagesService.sendAdminGenerationNotification(dto);
	}
}
