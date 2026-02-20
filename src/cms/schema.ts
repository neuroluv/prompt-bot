import type {
  IFile,
  IPayment,
  ISubscriptionPlan,
  IUser,
  IUserSubscription,
} from 'lib/types/directus';

export type CollectionKey<Schema> = Extract<keyof Schema, string>;

export interface DirectusLink<TItem> {
  id: number;
  collection: CollectionKey<CmsSchema>;
  item: TItem;
  sort?: number | null;
}

export interface CmsSchema {
  subscription_plans: ISubscriptionPlan[];
  payments: IPayment[];
  user_subscriptions: IUserSubscription[];
  users: IUser[];
  // System
  directus_files: Partial<IFile>;
}
