import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class InternalTokenGuard implements CanActivate {
	private readonly token: string;

	constructor(config: ConfigService) {
		this.token = config.get<string>('PROMPT_BOT_INTERNAL_TOKEN')?.trim() || '';
	}

	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<Request>();
		const authorization = request.headers.authorization;
		const provided = authorization?.startsWith('Bearer ')
			? authorization.slice('Bearer '.length).trim()
			: '';

		if (!this.token || !safeEqual(provided, this.token)) {
			throw new UnauthorizedException('Invalid internal token');
		}

		return true;
	}
}

function safeEqual(left: string, right: string): boolean {
	const leftBuffer = Buffer.from(left, 'utf8');
	const rightBuffer = Buffer.from(right, 'utf8');
	return (
		leftBuffer.length === rightBuffer.length &&
		timingSafeEqual(leftBuffer, rightBuffer)
	);
}
