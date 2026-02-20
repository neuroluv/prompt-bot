import type { CmsSchema } from 'cms';
import type { IUserSubscription } from './IUserSubscription';
import type { Query } from '@directus/sdk';

export type IUserQuery = Query<CmsSchema, IUser>;

export interface IUser extends IAuthUser {
  id: number;
  last_seen_date?: string;
  subscriptions: IUserSubscription[];
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

export interface IUsersSubscriptions {
  id: number;
  photos_id: number | IUserSubscription;
  users_id: number | IUser;
  added_date: string;
}
