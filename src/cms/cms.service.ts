import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { type AxiosInstance } from 'axios';
import { SystemLoggerService } from 'config';
import type { DirectusItemResponse, DirectusListResponse } from 'lib/types';
import { PromptFile, PromptFileDownload } from 'lib/types/prompt-files';
import type { User } from 'lib/types/user';
import type { Context } from 'telegraf';

@Injectable()
export class CmsService {
  private API_URL: string;
  STATIC_FILES_URL: string;
  http: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,

    private readonly logger: SystemLoggerService,
  ) {
    this.API_URL = this.configService.getOrThrow<string>('CMS_URL');
    this.STATIC_FILES_URL = `${this.API_URL}/assets`;

    this.http = axios.create({
      baseURL: this.API_URL,
      timeout: 15000,
    });
  }

  async getAllPromptFiles(): Promise<PromptFile[]> {
    const response = await this.http.get<{ data: PromptFile[] }>(
      `/items/prompt_files/?fields=*,file.*`,
    );
    return response.data.data;
  }

  async upsertUser(ctx: Context): Promise<User> {
    const telegramId = ctx.from?.id;
    if (!telegramId) throw new Error('ctx.from is empty');

    const userData = {
      telegram_id: telegramId,
      first_name: ctx.from.first_name ?? null,
      last_name: ctx.from.last_name ?? null,
      username: ctx.from.username ? `@${ctx.from.username}` : null,
      is_bot: Boolean(ctx.from.is_bot),
      is_premium: Boolean((ctx.from as any).is_premium),
      language_code: ctx.from.language_code ?? null,
    };

    // 1) ищем пользователя
    const found = await this.http.get<DirectusListResponse<User>>(
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
      const updated = await this.http.patch<DirectusItemResponse<User>>(
        `/items/users/${existing.id}`,
        userData,
      );
      return updated.data.data;
    }

    // 3) создаём
    const created = await this.http.post<DirectusItemResponse<User>>(
      '/items/users',
      userData,
    );
    return created.data.data;
  }

  async getPromptFileByName(fileName: string): Promise<PromptFile> {
    const response = await axios.get<{ data: PromptFile[] }>(
      `${this.API_URL}/items/prompt_files?filter[system_name][_eq]=${fileName}&fields=*,file.*`,
    );

    return response.data.data[0];
  }

  async createPromptFileStats(userId: bigint, fileId: number) {
    const res = await this.http.post<DirectusItemResponse<PromptFileDownload>>(
      '/items/prompt_file_downloads',
      {
        user: userId,
        prompt_file: fileId,
      },
    );

    return res.data.data;
  }
}
