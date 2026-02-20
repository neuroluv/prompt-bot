import type { IPayment } from './IPayment';
import type { IUser } from './IUser';

export interface IUserSubscription {
  id: number;
  status: 'active' | 'pending' | 'canceled' | 'refunded' | 'expired';
  started_at: string;
  ends_at?: string;
  activated_at?: string;
  cancelled_at?: string;
  source: string;
  payments: IPayment;
  user: IUser;
  // Date
  date_created: string;
  date_updated?: string;
}

export interface ICreateUserSubscription {
  status: 'active' | 'pending' | 'canceled' | 'refunded' | 'expired';
  started_at: string;
  ends_at?: string;
  activated_at?: string;
  cancelled_at?: string;
  source: string;
  payments: number;
  user: number;
  // Date
  date_created: string;
  date_updated?: string;
}
