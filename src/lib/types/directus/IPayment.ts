import { IUserSubscription } from './IUserSubscription';

export type PaymentStatus =
  | 'pending'
  | 'succeeded'
  | 'created'
  | 'canceled'
  | 'refunded';

export interface IPayment {
  id: number;
  status: PaymentStatus;
  provider: string;
  amount: number;
  currency: string;
  provider_payment_id: string;
  idempotence_key?: string;
  confirmation_url?: string;
  paid_at?: string;
  raw: string;
  is_link_sent: boolean;
  invite_link?: string;
  user_subscription?: IUserSubscription;

  date_created: string;
  date_updated?: string;
}
