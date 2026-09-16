import {
	BadGatewayException,
	Injectable,
	ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type StudioAdminUserSummary = {
	activeSessions: number;
	balanceCredits: string;
	blockReason: string | null;
	blockedAt: string | null;
	displayName: string;
	email: string | null;
	emailDomain: string | null;
	emailDomainAccounts: number;
	id: string;
	reservedCredits: string;
	sameIpAccounts: number;
	status: string;
	successfulRuns: number;
	totalRuns: number;
};

type MutationResult = StudioAdminUserSummary & {
	changed: boolean;
	revokedChallenges?: number;
	revokedSessions?: number;
	sessionsRestored?: number;
};

@Injectable()
export class StudioAdminUsersService {
	private readonly apiUrl: string;
	private readonly internalToken: string;

	constructor(config: ConfigService) {
		this.apiUrl = config.get<string>('NEUROLUV_API_URL')?.trim() || '';
		this.internalToken =
			config.get<string>('PROMPT_BOT_INTERNAL_TOKEN')?.trim() || '';
	}

	summary(userId: string): Promise<StudioAdminUserSummary> {
		return this.request<StudioAdminUserSummary>(userId, 'GET');
	}

	block(userId: string, adminTelegramId: number): Promise<MutationResult> {
		return this.request<MutationResult>(
			userId,
			'POST',
			'block',
			adminTelegramId,
		);
	}

	unblock(userId: string, adminTelegramId: number): Promise<MutationResult> {
		return this.request<MutationResult>(
			userId,
			'POST',
			'unblock',
			adminTelegramId,
		);
	}

	private async request<T>(
		userId: string,
		method: 'GET' | 'POST',
		action?: 'block' | 'unblock',
		adminTelegramId?: number,
	): Promise<T> {
		if (!this.apiUrl || !this.internalToken) {
			throw new ServiceUnavailableException(
				'NEUROLUV_API_URL and PROMPT_BOT_INTERNAL_TOKEN are required',
			);
		}
		const url = new URL(this.apiUrl);
		url.pathname = `${url.pathname.replace(/\/+$/, '')}/internal/prompt-bot/users/${encodeURIComponent(userId)}${action ? `/${action}` : ''}`;
		url.search = '';
		url.hash = '';

		let response: Response;
		try {
			response = await fetch(url, {
				method,
				headers: {
					authorization: `Bearer ${this.internalToken}`,
					...(method === 'POST' ? { 'content-type': 'application/json' } : {}),
				},
				...(method === 'POST'
					? {
							body: JSON.stringify({
								adminTelegramId: String(adminTelegramId),
							}),
						}
					: {}),
				signal: AbortSignal.timeout(10_000),
			});
		} catch {
			throw new BadGatewayException('Neuroluv API is unavailable');
		}
		if (!response.ok) {
			const payload = await response.text();
			throw new BadGatewayException(
				`Neuroluv API rejected the action (${response.status}): ${payload.slice(0, 300)}`,
			);
		}
		return (await response.json()) as T;
	}
}
