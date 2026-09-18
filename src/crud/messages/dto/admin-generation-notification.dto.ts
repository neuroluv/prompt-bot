import { Type } from 'class-transformer';
import {
	ArrayMaxSize,
	IsArray,
	IsInt,
	IsOptional,
	IsString,
	IsUrl,
	IsUUID,
	Matches,
	MaxLength,
	Min,
	ValidateNested,
} from 'class-validator';
import { GenerationNotificationMediaDto } from './generation-notification.dto';

export class AdminGenerationNotificationDto {
	@IsOptional()
	@IsString()
	@Matches(/^-?[1-9]\d{0,19}$/)
	chatId?: string;

	@IsOptional()
	@IsInt()
	@Min(1)
	messageThreadId?: number;

	@IsUUID()
	runId: string;

	@IsUUID()
	userId: string;

	@IsString()
	@MaxLength(200)
	displayName: string;

	@IsOptional()
	@IsString()
	@MaxLength(320)
	email?: string | null;

	@IsString()
	@MaxLength(200)
	modelName: string;

	@IsString()
	@MaxLength(100)
	providerType: string;

	@IsUrl({ protocols: ['https'], require_protocol: true })
	@MaxLength(2_048)
	generationUrl: string;

	@IsOptional()
	@IsString()
	@MaxLength(16_000)
	prompt?: string | null;

	@IsOptional()
	@IsString()
	@MaxLength(32_000)
	resultText?: string | null;

	@IsString()
	@Matches(/^\d+$/)
	@MaxLength(30)
	creditsSpent: string;

	@IsString()
	@Matches(/^\d+$/)
	@MaxLength(30)
	balanceAfter: string;

	@IsArray()
	@ArrayMaxSize(10)
	@ValidateNested({ each: true })
	@Type(() => GenerationNotificationMediaDto)
	media: GenerationNotificationMediaDto[];
}
