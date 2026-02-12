import { Injectable } from '@nestjs/common';
import { BotService } from 'bot';
import Bottleneck from 'bottleneck';
import { CmsService } from 'cms/cms.service';
import { SystemLoggerService } from 'config';
import {
  buildInlineKeyboard,
  isBlockedError,
  mapParseMode,
  Normalize,
  sleep,
} from 'lib/helpers';
import type {
  Mailing,
  MailingLogCreate,
  MailingPayload,
} from 'lib/types/mailing';

@Injectable()
export class MailingService {
  private running = new Set<number>();
  private limiter = new Bottleneck({ minTime: 45, maxConcurrent: 5 });

  constructor(
    private readonly cms: CmsService,
    private readonly bot: BotService,
    private readonly logger: SystemLoggerService,
  ) {
    this.logger.setContext(MailingService.name);
  }

  startInBackground(payload: MailingPayload) {
    const mailingId = Number(payload.id);
    if (this.running.has(mailingId)) return;
    this.running.add(mailingId);

    setImmediate(async () => {
      try {
        await this.run(payload);
      } catch (e: any) {
        this.logger.error(`[mailing] fatal id=${mailingId} ${e?.message ?? e}`);
      } finally {
        this.running.delete(mailingId);
      }
    });
  }

  private async run(payload: MailingPayload) {
    const mailingId = Number(payload.id);

    // Стартовые поля — лучше пусть Nest пишет время, Directus “queued” уже поставил Flow
    const startedAt = new Date();
    await this.patchMailing(mailingId, {
      status: 'sending',
      send_at: startedAt.toISOString(),
      started_at: startedAt.toISOString(),
      finished_at: null,
      duration_sec: 0,
      total_planned: 0,
      total_sent: 0,
      total_failed: 0,
    });

    const replyMarkup = buildInlineKeyboard(payload.buttons);

    // подготовка текста под parse_mode
    const parseMode = mapParseMode(String(payload.parse_mode));
    let text = (payload.text ?? '').trim();

    if (parseMode === 'HTML') {
      text = Normalize.html(text);
    } else if (parseMode === 'MarkdownV2') {
      // если ты хранишь “чистый текст” — экранируй, если ты хранишь уже готовую разметку MarkdownV2 — убери эту строку
      // text = escapeMarkdownV2(text);
      // Я оставлю как безопасный режим:
      text = Normalize.markdownV2(text);
    }

    // build target
    const target = await this.buildTarget(payload);

    // planned count (после фильтрации blocked/без telegram_id)
    await this.patchMailing(mailingId, { total_planned: target.totalPlanned });

    let sent = 0;
    let failed = 0;

    const flush = async () => {
      await this.patchMailing(mailingId, {
        total_sent: sent,
        total_failed: failed,
      });
    };

    try {
      for (const u of target.users) {
        const ok = await this.sendOne(
          mailingId,
          u.userId,
          u.telegramId,
          text,
          parseMode,
          payload.photo ?? null,
          replyMarkup,
        );

        ok ? sent++ : failed++;

        if ((sent + failed) % 50 === 0) await flush();

        // отмена
        if ((sent + failed) % 200 === 0) {
          const m = await this.getMailingStatus(mailingId);
          if (m === 'canceled') break;
        }
      }

      await flush();

      const finishedAt = new Date();
      const durationSec = Math.max(
        0,
        Math.floor((finishedAt.getTime() - startedAt.getTime()) / 1000),
      );

      const finalStatus =
        sent > 0 || target.totalPlanned === 0 ? 'sent' : 'failed';

      await this.patchMailing(mailingId, {
        status: finalStatus,
        finished_at: finishedAt.toISOString(),
        duration_sec: durationSec,
      });

      this.logger.debug(
        `[mailing] done id=${mailingId} planned=${target.totalPlanned} sent=${sent} failed=${failed}`,
      );
    } catch (e: any) {
      await flush();
      await this.patchMailing(mailingId, { status: 'failed' });
      await this.createMailingLog({
        mailing: mailingId,
        status: 'failed',
        error_message: `FATAL: ${e?.message ?? String(e)}`,
      });
      throw e;
    }
  }

  private async sendOne(
    mailingId: number,
    userId: any,
    telegramId: number,
    text: string,
    parse_mode: 'HTML' | 'Markdown' | 'MarkdownV2',
    photoId: string | null,
    replyMarkup?: any,
  ): Promise<boolean> {
    try {
      await this.limiter.schedule(async () => {
        if (photoId) {
          const buf = await this.cms.getDirectusFileBuffer(photoId);

          // caption limit 1024
          const caption = text.length <= 1024 ? text : text.slice(0, 1024);

          await this.bot.telegram.sendPhoto(
            telegramId,
            { source: buf },
            { caption, parse_mode, reply_markup: replyMarkup },
          );

          if (text.length > 1024) {
            await this.bot.telegram.sendMessage(
              telegramId,
              text.slice(1024, 4096),
              { parse_mode, reply_markup: replyMarkup },
            );
          }
        } else {
          await this.bot.telegram.sendMessage(telegramId, text.slice(0, 4096), {
            parse_mode,
            reply_markup: replyMarkup,
          });
        }
      });

      return true;
    } catch (e: any) {
      // 429 retry_after
      const retryAfter = e?.response?.parameters?.retry_after;
      if (retryAfter) await sleep((Number(retryAfter) + 1) * 1000);

      const code = e?.response?.error_code ?? e?.code ?? null;
      const msg = e?.response?.description ?? e?.message ?? String(e);

      // если заблокировал — ставим toggle на user
      if (isBlockedError(e) && userId) {
        await this.cms.markUserBlocked(userId);
      }

      await this.createMailingLog({
        mailing: mailingId,
        status: 'failed',
        user: userId ?? null,
        chat_id: telegramId,
        error_code: code,
        error_message: msg,
      });

      return false;
    }
  }

  private async buildTarget(payload: MailingPayload): Promise<{
    users: Array<{ userId: any; telegramId: number }>;
    totalPlanned: number;
  }> {
    const mode = payload.target_mode;

    // manual: payload.target_users = [ids]
    if (mode === 'manual') {
      const ids = (payload.target_users ?? []).map(Number).filter(Boolean);
      const rows = await this.cms.getUsersByIds(ids);

      const users = rows
        .filter((u: any) => u.telegram_id && !u.is_blocked)
        .map((u: any) => ({ userId: u.id, telegramId: Number(u.telegram_id) }));

      return { users, totalPlanned: users.length };
    }

    // query-based modes (all/premium/filter)
    const base: any = {
      telegram_id: { _nnull: true },
      is_blocked_the_bot: { _neq: true },
    };

    if (mode === 'premium') {
      base.is_premium = { _eq: true };
    }

    if (mode === 'filter') {
      const tf = payload.target_filter ?? {};
      base._and = [tf]; // добавляем к base
    }

    // Пагинация: собрать всех users без Redis/очередей — в память
    const pageSize = 500;
    let offset = 0;
    const users: Array<{ userId: any; telegramId: number }> = [];

    while (true) {
      const res = await this.cms.http.get('/items/users', {
        params: {
          fields: ['id', 'telegram_id'],
          filter: base,
          limit: pageSize,
          offset,
        },
      });

      const data = res.data.data ?? [];
      if (!data.length) break;

      for (const row of data) {
        if (!row.telegram_id) continue;
        users.push({ userId: row.id, telegramId: Number(row.telegram_id) });
      }

      offset += data.length;
    }

    return { users, totalPlanned: users.length };
  }

  // Directus interactions
  private async patchMailing(id: number, patch: Partial<Mailing>) {
    const response = await this.cms.http.patch(
      `/items/tg_mailing/${id}`,
      patch,
    );
  }

  private async createMailingLog(payload: MailingLogCreate) {
    await this.cms.http.post(`/items/tg_mailing_logs`, payload);
  }

  private async getMailingStatus(id: number): Promise<string> {
    const res = await this.cms.http.get(`/items/tg_mailing/${id}`, {
      params: { fields: ['status'] },
    });
    return res.data.data?.status;
  }
}
