import { applyDecorators, UseGuards } from '@nestjs/common';
import { CheckSubscriptionGuard } from 'auth/guards/check-subscription.guard';

export function CheckSubscription() {
	return applyDecorators(UseGuards(CheckSubscriptionGuard));
}
