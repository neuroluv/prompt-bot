import {
	createDirectus,
	type DirectusClient,
	readItems,
	rest,
	type RestClient,
	staticToken,
	type StaticTokenClient,
} from '@directus/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { type AxiosInstance } from 'axios';
import { SystemLoggerService } from 'config';
import type { DirectusItemResponse, DirectusListResponse } from 'lib/types';
import type { IUser as IDirectusUser } from 'lib/types/directus';
import { PromptFile, PromptFileDownload } from 'lib/types/prompt-files';
import type { IUser } from 'lib/types/user';
import * as qs from 'qs';
import type { Context } from 'telegraf';
import { CmsSchema } from './schema';

@Injectable()
export class CmsService {
	private CMS_URL: string;
	private CMS_TOKEN: string;
	STATIC_FILES_URL: string;
	http: AxiosInstance;
	directus: DirectusClient<CmsSchema> &
		StaticTokenClient<CmsSchema> &
		RestClient<CmsSchema>;

	constructor(
		private readonly configService: ConfigService,

		private readonly logger: SystemLoggerService,
	) {
		this.CMS_URL = this.configService.getOrThrow<string>('CMS_URL');
		this.CMS_TOKEN = this.configService.getOrThrow<string>('CMS_TOKEN');
		this.STATIC_FILES_URL = `${this.CMS_URL}/assets`;
		this.directus = createDirectus<CmsSchema>(this.CMS_URL)
			.with(staticToken(this.CMS_TOKEN))
			.with(rest());

		this.http = axios.create({
			baseURL: this.CMS_URL,
			timeout: 15000,
			headers: { Authorization: `Bearer ${this.CMS_TOKEN}` },
			paramsSerializer: {
				serialize: (params) => qs.stringify(params, { encodeValuesOnly: true }),
			},
		});

		this.http.interceptors.response.use(
			(res) => res,
			(err) => {
				const status = err?.response?.status;
				const data = err?.response?.data;
				const method = err?.config?.method?.toUpperCase();
				const url = err?.config?.baseURL
					? `${err.config.baseURL}${err.config.url}`
					: err?.config?.url;

				this.logger.error(
					`[directus] ${method} ${url} -> ${status} ${JSON.stringify(data)}`,
				);

				throw err;
			},
		);
	}

	async getAllPromptFiles(): Promise<PromptFile[]> {
		const response = await this.http.get<{ data: PromptFile[] }>(
			`/items/prompt_files/?fields=*,file.*`,
		);
		return response.data.data;
	}

	async upsertUser(ctx: Context): Promise<IUser> {
		const telegramId = ctx.from?.id;
		if (!telegramId) throw new Error('ctx.from is empty');

		const userData = {
			telegram_id: telegramId,
			first_name: ctx.from.first_name ?? null,
			last_name: ctx.from.last_name ?? null,
			username: ctx.from.username ?? null,
			is_bot: Boolean(ctx.from.is_bot),
			is_premium: Boolean((ctx.from as any).is_premium),
			language_code: ctx.from.language_code ?? null,
			is_blocked_the_bot: false,
		};

		// 1) ищем пользователя
		const found = await this.http.get<DirectusListResponse<IUser>>(
			'/items/users',
			{
				params: {
					filter: { telegram_id: { _eq: telegramId } },
					limit: 1,
				},
			},
		);

		const existing = found.data.data?.[0];

		// 2) обновляем по ID
		if (existing?.id) {
			const updated = await this.http.patch<DirectusItemResponse<IUser>>(
				`/items/users/${existing.id}`,
				userData,
			);
			return updated.data.data;
		}

		// 3) создаём
		const created = await this.http.post<DirectusItemResponse<IUser>>(
			'/items/users',
			userData,
		);
		return created.data.data;
	}

	async getPromptFileByName(fileName: string): Promise<PromptFile> {
		const response = await axios.get<{ data: PromptFile[] }>(
			`${this.CMS_URL}/items/prompt_files?filter[system_name][_eq]=${fileName}&fields=*,file.*`,
		);

		return response.data.data[0];
	}

	async createPromptFileStats(
		userId: bigint,
		fileId: number,
		file_title: string,
	): Promise<PromptFileDownload> {
		const res = await this.http.post<DirectusItemResponse<PromptFileDownload>>(
			'/items/prompt_file_downloads',
			{
				user: userId,
				prompt_file: fileId,
				file_title,
			},
		);

		return res.data.data;
	}

	async getDirectusFileBuffer(fileId: string): Promise<Buffer> {
		const res = await this.http.get<ArrayBuffer>(`/assets/${fileId}`, {
			responseType: 'arraybuffer',
			params: { download: 1 },
		});
		return Buffer.from(res.data);
	}

	/**
	 * Получить пользователя по телеграм id (Directus user.id)
	 */
	async getUserByTelegramId(telegramId: number): Promise<IDirectusUser> {
		const [user] = await this.directus.request(
			readItems('users', {
				filter: { telegram_id: { _eq: telegramId } },
			}),
		);
		return user;
	}

	/**
	 * Получить пользователей по массиву id (Directus users.id)
	 * Возвращает минимум полей, нужных для рассылки.
	 */
	async getUsersByIds(ids: number[]): Promise<IUser[]> {
		const clean = (ids ?? []).map(Number).filter((x) => Number.isFinite(x));
		if (!clean.length) return [];

		const res = await this.http.get<DirectusListResponse<IUser>>(
			'/items/users',
			{
				params: {
					fields: ['id', 'telegram_id', 'is_premium', 'is_blocked_the_bot'],
					filter: { id: { _in: clean } },
					limit: clean.length,
				},
			},
		);

		return res.data.data ?? [];
	}

	/**
	 * Помечает пользователя как заблокировавшего бота.
	 * Вызываем при ошибках Telegram: "bot was blocked by the user", "chat not found" и т.п.
	 */
	async markUserBlocked(userId: number) {
		await this.http.patch(`/items/users/${userId}`, {
			is_blocked_the_bot: true,
		});
	}
}
