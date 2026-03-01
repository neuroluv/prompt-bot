import { Module } from '@nestjs/common';
import { CmsModule } from 'cms';
import { SubscriptionPlanService } from './subscription-plan.service';
import { UserSubscriptionsService } from './users-subscriptions.service';

@Module({
	imports: [CmsModule],
	providers: [SubscriptionPlanService, UserSubscriptionsService],
	exports: [SubscriptionPlanService, UserSubscriptionsService],
})
export class SubscriptionModule {}
