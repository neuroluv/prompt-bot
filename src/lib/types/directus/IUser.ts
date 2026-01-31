export interface IUser extends IAuthUser {
  id: number;
  last_seen_date?: string;
}

export interface IAuthUser {
  telegram_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_bot: boolean;
  is_premium: boolean;
  photo_url?: string;
}
