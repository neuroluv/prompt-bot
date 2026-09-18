import { Type } from 'class-transformer';
import {
	Equals,
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	Matches,
	MaxLength,
	Min,
	ValidateNested,
} from 'class-validator';

export class AdminNotificationActionDto {
	@Equals('user_registration')
	type: 'user_registration';

	@IsUUID()
	userId: string;
}

export class AdminNotificationDto {
	@IsString()
	@MaxLength(3900)
	message: string;

	@IsOptional()
	@IsString()
	@Matches(/^-?[1-9]\d{0,19}$/)
	chatId?: string;

	@IsOptional()
	@IsInt()
	@Min(1)
	messageThreadId?: number;

	@IsOptional()
	@ValidateNested()
	@Type(() => AdminNotificationActionDto)
	action?: AdminNotificationActionDto;
}
