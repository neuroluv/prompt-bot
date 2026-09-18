import { IsIn, IsString, IsUrl, Matches, MaxLength } from 'class-validator';

export class AccountNotificationDto {
	@IsString()
	@Matches(/^\d{1,20}$/)
	chatId: string;

	@IsIn(['payment', 'promo'])
	kind: 'payment' | 'promo';

	@IsString()
	@MaxLength(200)
	label: string;

	@IsString()
	@Matches(/^\d+$/)
	@MaxLength(30)
	amount: string;

	@IsString()
	@Matches(/^\d+$/)
	@MaxLength(30)
	balanceAfter: string;

	@IsString()
	@MaxLength(64)
	referenceId: string;

	@IsUrl({ protocols: ['https'], require_protocol: true })
	@MaxLength(2_048)
	walletUrl: string;
}
