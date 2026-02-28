import { readItems } from '@directus/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CmsService } from 'cms';
import { ISubscriptionPlan } from 'lib/types/directus';

@Injectable()
export class SubscriptionPlanService {
	privateChannelSlug: string;

	constructor(
		private readonly cms: CmsService,
		private readonly config: ConfigService,
	) {
		this.privateChannelSlug = this.config.getOrThrow(
			'CMS_TELEGRAM_PRIVATE_CHANNEL_SLUG',
		);
	}

	async getPlanBySlug(currency: string): Promise<ISubscriptionPlan | null> {
		const [result] = await this.cms.directus.request(
			readItems('subscription_plans', {
				filter: {
					slug: {
						_eq: `${this.privateChannelSlug}${currency.toLowerCase()}`,
					},
				},
			}),
		);

		return result;
	}

	async getPlanssByIncludeSlug(slug: string): Promise<ISubscriptionPlan[]> {
		const result = await this.cms.directus.request(
			readItems('subscription_plans', {
				filter: {
					_and: [
						{
							slug: { _contains: slug },
						},
						{
							status: { _eq: 'published' },
						},
					],
				},
				sort: ['date_created'],
			}),
		);

		return result;
	}

	async getPlanByPriceAndCurrency(
		price: number,
		currency: string,
	): Promise<ISubscriptionPlan> {
		const [result] = await this.cms.directus.request(
			readItems('subscription_plans', {
				filter: {
					_and: [
						{
							price: { _eq: price },
						},
						{
							currency: { _eq: currency },
						},
					],
				},
			}),
		);

		return result;
	}
}
