import { createItem } from '@directus/sdk';
import { Injectable } from '@nestjs/common';
import { CmsService } from 'cms';
import type { IUserSubscription } from 'lib/types/directus';

@Injectable()
export class UserSubscriptionsService {
  constructor(private readonly cms: CmsService) {}

  async create(subscription: Partial<IUserSubscription>) {
    return await this.cms.directus.request(
      createItem('user_subscriptions', subscription),
    );
  }
}
