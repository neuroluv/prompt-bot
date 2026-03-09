import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConstantsService {
	constructor(private readonly config: ConfigService) {}

	SUPPORT_USERNAME: string = this.config.getOrThrow(
		'TELEGRAM_SUPPORT_USERNAME',
	);
	SITE_URL: string = this.config.getOrThrow('SITE_URL');

	PRIVACY_URL: string = `${this.SITE_URL}/${this.config.getOrThrow('SITE_PRIVACY_POLICY_PERMALINK')}`;

	OFFER_URL: string = `${this.SITE_URL}/${this.config.getOrThrow('SITE_PUBLIC_OFFER_PERMALINK')}`;
}
