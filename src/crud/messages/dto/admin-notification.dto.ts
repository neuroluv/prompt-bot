import { Type } from 'class-transformer';
import {
	Equals,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
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
	@ValidateNested()
	@Type(() => AdminNotificationActionDto)
	action?: AdminNotificationActionDto;
}
