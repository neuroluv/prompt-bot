import { Type } from 'class-transformer';
import {
	ArrayMaxSize,
	IsArray,
	IsIn,
	IsOptional,
	IsString,
	IsUrl,
	Matches,
	MaxLength,
	ValidateNested,
} from 'class-validator';

export class GenerationNotificationMediaDto {
	@IsIn(['photo', 'video'])
	type: 'photo' | 'video';

	@IsUrl({ protocols: ['https'], require_protocol: true })
	@MaxLength(4_096)
	url: string;
}

export class GenerationNotificationDto {
	@IsString()
	@Matches(/^\d{1,20}$/)
	chatId: string;

	@IsIn(['succeeded', 'partially_succeeded', 'failed', 'cancelled'])
	status: 'succeeded' | 'partially_succeeded' | 'failed' | 'cancelled';

	@IsString()
	@MaxLength(200)
	modelName: string;

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

	@IsOptional()
	@IsString()
	@MaxLength(2_000)
	errorMessage?: string | null;

	@IsArray()
	@ArrayMaxSize(10)
	@ValidateNested({ each: true })
	@Type(() => GenerationNotificationMediaDto)
	media: GenerationNotificationMediaDto[];
}
