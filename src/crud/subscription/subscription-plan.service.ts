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

  async getChannelBySlug(currency: string): Promise<ISubscriptionPlan | null> {
    const [result] = await this.cms.directus.request(
      readItems('subscription_plans', {
        filter: {
          slug: { _eq: `${this.privateChannelSlug}${currency.toLowerCase()}` },
        },
      }),
    );

    return result;
  }

  async getChannelsByIncludeSlug(slug: string): Promise<ISubscriptionPlan[]> {
    const result = await this.cms.directus.request(
      readItems('subscription_plans', {
        filter: {
          slug: { _contains: slug },
        },
        sort: ['date_created'],
      }),
    );

    return result;
  }
}
