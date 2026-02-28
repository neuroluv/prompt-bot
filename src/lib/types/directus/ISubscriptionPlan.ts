import type { IDefaultStatus } from './IDefaultStatus';

export interface ISubscriptionPlan {
	id: number;
	title: string;
	description: string;
	price: number;
	currency: string;
	type: 'lifetime' | 'monthly' | 'yearly';
	status: IDefaultStatus;
	slug: string;
	date_created: string;
	date_updated?: string;
}
