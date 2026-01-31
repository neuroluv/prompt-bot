export type MailingStatus =
  | 'draft'
  | 'queued'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'canceled';

export type TgParseMode =
  | 'HTML'
  | 'Markdown'
  | 'MarkdownV2'
  | 'html'
  | 'markdown'
  | 'markdownv2';

export type TargetMode = 'all' | 'premium' | 'manual' | 'filter';

export interface MailingPayload {
  id: number;
  name: string;
  text: string;
  photo?: string | null;
  parse_mode: TgParseMode;
  target_mode: TargetMode;
  target_filter?: any | null;
  scheduled_at?: string | null;
  status: MailingStatus;
  buttons?: MailingButton[];
  target_users?: number[];
}

export interface Mailing extends MailingPayload {
  send_at?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  duration_sec?: number | null;
  total_planned?: number | null;
  total_sent?: number | null;
  total_failed?: number | null;
  logs?: string | null;
}

export interface MailingButton {
  id: number;
  sort?: number | null;
  text: string;
  url: string;
  mailings: number;
}

export interface MailingLogCreate {
  mailing: number;
  status: 'failed' | 'skipped' | 'info';
  user?: any;
  chat_id?: string | number | null;
  error_code?: string | number | null;
  error_message?: string | null;
}

export interface DirectusWebhookBody {
  id: number;
}

export interface InlineKeyboardButton {
  text: string;
  url?: string;
}
