import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiClient } from 'nalog.ru';
import { API_URL } from 'nalog.ru/dist/constants';
import type {
	CancelIncomeRequest,
	CreateIncomeRequest,
	CreateIncomeResponse,
	IncomeClient,
	IncomeServiceItem,
	Receipt,
} from 'nalog.ru/dist/interfaces';
import { readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';

interface NalogSessionToken {
	accessToken: string;
	refreshToken?: string;
	updatedAt: string;
}

export interface ICreateIncome extends IncomeServiceItem {
	client?: IncomeClient;
	paymentType?: CreateIncomeRequest['paymentType'];
	ignoreMaxTotalIncomeRestriction?: boolean;
}

@Injectable()
export class ReceiptService {
	private api: ApiClient;
	private readonly inn: string;
	private readonly password: string;
	private readonly tokenPath: string | null;
	private accessToken: string | null;
	private refreshToken: string | null;

	private initPromise: Promise<void> | null = null;
	private refreshPromise: Promise<void> | null = null;

	constructor(private readonly config: ConfigService) {
		this.inn = this.config.getOrThrow<string>('NALOG_INN');
		this.password = this.config.getOrThrow<string>('NALOG_PASSWORD');

		this.accessToken = this.normalizeToken(
			this.config.get<string>('NALOG_ACCESS_TOKEN') ??
				this.config.get<string>('NALOG_API_KEY'),
		);
		this.refreshToken = this.normalizeToken(
			this.config.get<string>('NALOG_REFRESH_TOKEN'),
		);
		this.tokenPath = this.resolveTokenPath(
			this.normalizeToken(this.config.get<string>('NALOG_TOKEN_PATH')) ??
				'session-token.json',
		);

		this.api = new ApiClient(this.accessToken ?? undefined);
	}

	async newIncome(data: ICreateIncome): Promise<CreateIncomeResponse> {
		return this.withAuthRetry((api) => {
			const payload: CreateIncomeRequest = {
				services: [
					{
						name: data.name,
						amount: data.amount,
						quantity: data.quantity,
					},
				],
				totalAmount: data.amount * data.quantity,
				client: data.client,
				paymentType: data.paymentType ?? 'ELECTRONIC',
				ignoreMaxTotalIncomeRestriction:
					data.ignoreMaxTotalIncomeRestriction ?? false,
			};

			return api.income.createMultipleItems(payload);
		});
	}

	async cancelIncome(data: CancelIncomeRequest): Promise<unknown> {
		return this.withAuthRetry((api) => api.income.cancel(data));
	}

	async getReceipt(receiptId: string): Promise<Receipt> {
		return this.withAuthRetry(async (api) => {
			const response = await api.receipt.getOne({
				inn: this.inn,
				receiptId,
			});

			return response.data as Receipt;
		});
	}

	getPrintUrl(receiptId: string, inn: string = this.inn): string {
		return `${API_URL}/receipt/${inn}/${receiptId}/print`;
	}

	private async withAuthRetry<T>(
		request: (api: ApiClient) => Promise<T>,
	): Promise<T> {
		await this.ensureInitialized();

		try {
			return await request(this.api);
		} catch (error) {
			if (!this.isUnauthorizedError(error)) {
				throw error;
			}

			await this.refreshOrRelogin();

			return request(this.api);
		}
	}

	private async ensureInitialized(): Promise<void> {
		if (!this.initPromise) {
			this.initPromise = this.initializeAuth();
		}

		try {
			await this.initPromise;
		} finally {
			this.initPromise = null;
		}
	}

	private async initializeAuth(): Promise<void> {
		if (!this.accessToken && this.tokenPath) {
			const savedTokens = await this.readSavedTokens();
			if (savedTokens?.accessToken) {
				this.accessToken = savedTokens.accessToken;
			}
			if (!this.refreshToken && savedTokens?.refreshToken) {
				this.refreshToken = savedTokens.refreshToken;
			}
		}

		if (!this.accessToken) {
			await this.loginByInnAndPassword();
			return;
		}

		this.recreateClient();
	}

	private async refreshOrRelogin(): Promise<void> {
		if (!this.refreshPromise) {
			this.refreshPromise = this.refreshOrReloginInternal();
		}

		try {
			await this.refreshPromise;
		} finally {
			this.refreshPromise = null;
		}
	}

	private async refreshOrReloginInternal(): Promise<void> {
		if (this.refreshToken) {
			const authClient = new ApiClient(this.accessToken ?? undefined);
			const refreshedToken = await authClient.refreshAccessToken(
				this.refreshToken,
			);

			if (refreshedToken) {
				this.accessToken = refreshedToken;
				this.recreateClient();
				await this.persistTokens();
				return;
			}
		}

		await this.loginByInnAndPassword();
	}

	private async loginByInnAndPassword(): Promise<void> {
		const authClient = new ApiClient();
		this.accessToken = await authClient.createAccessToken(
			this.inn,
			this.password,
		);
		this.recreateClient();
		await this.persistTokens();
	}

	private recreateClient(): void {
		this.api = new ApiClient(this.accessToken ?? undefined);
	}

	private isUnauthorizedError(error: unknown): boolean {
		if (!error || typeof error !== 'object' || !('response' in error)) {
			return false;
		}

		const status = (error as { response?: { status?: number } }).response
			?.status;
		return status === 401 || status === 403;
	}

	private normalizeToken(value?: string | null): string | null {
		if (!value) {
			return null;
		}

		const normalized = value.trim();
		return normalized.length > 0 ? normalized : null;
	}

	private resolveTokenPath(tokenPath: string): string | null {
		const normalizedTokenPath = this.normalizeToken(tokenPath);
		if (!normalizedTokenPath) {
			return null;
		}

		return isAbsolute(normalizedTokenPath)
			? normalizedTokenPath
			: resolve(process.cwd(), normalizedTokenPath);
	}

	private async readSavedTokens(): Promise<NalogSessionToken | null> {
		if (!this.tokenPath) {
			return null;
		}

		try {
			const rawContent = await readFile(this.tokenPath, 'utf8');
			if (!rawContent.trim()) {
				return null;
			}

			const parsed = JSON.parse(rawContent) as Partial<NalogSessionToken>;
			if (!parsed.accessToken || typeof parsed.accessToken !== 'string') {
				return null;
			}

			return {
				accessToken: parsed.accessToken,
				refreshToken:
					typeof parsed.refreshToken === 'string'
						? parsed.refreshToken
						: undefined,
				updatedAt:
					typeof parsed.updatedAt === 'string'
						? parsed.updatedAt
						: new Date().toISOString(),
			};
		} catch {
			return null;
		}
	}

	private async persistTokens(): Promise<void> {
		if (!this.tokenPath || !this.accessToken) {
			return;
		}

		const payload: NalogSessionToken = {
			accessToken: this.accessToken,
			refreshToken: this.refreshToken ?? undefined,
			updatedAt: new Date().toISOString(),
		};

		await writeFile(this.tokenPath, JSON.stringify(payload, null, 2), 'utf8');
	}
}
