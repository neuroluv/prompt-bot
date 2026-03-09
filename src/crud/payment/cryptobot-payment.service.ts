import { createItem, updateItems } from '@directus/sdk';
import {
	forwardRef,
	Inject,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	CRYPTOBOT_NOTIFICATION_FIELDS,
	getRawNotificationEvent,
	getRawNotificationObjectId,
	isPaymentNotificationEnvelope,
	normalizePaymentStatus,
} from '@utils';
import { BotService } from 'bot';
import { afterPayKeyboard } from 'bot/keyboards';
import { payMessages } from 'bot/messages';
import { CmsService } from 'cms/cms.service';
import { SystemLoggerService } from 'config';
import { UserSubscriptionsService } from 'crud/subscription/users-subscriptions.service';
import CryptoBotAPI, {
	type CryptoCurrencyCode,
	type Invoice,
} from 'crypto-bot-api';
import type { ICryptoPayInvoice, ICryptoPayUpdate } from 'lib/types/crypto-bot';
import type { IPayment, ISubscriptionPlan } from 'lib/types/directus';
import { PaymentService } from './payment.service';

@Injectable()
export class CryptoBotPaymentService {
	public readonly client: CryptoBotAPI;

	constructor(
		private readonly config: ConfigService,
		private readonly logger: SystemLoggerService,
		private readonly cms: CmsService,
		private readonly userSubsService: UserSubscriptionsService,
		@Inject(forwardRef(() => BotService))
		private readonly bot: BotService,
		@Inject(forwardRef(() => PaymentService))
		private readonly paymentService: PaymentService,
	) {
		this.client = new CryptoBotAPI(
			this.config.getOrThrow('CRYPTO_BOT_TOKEN'),
			process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet',
		);
	}

	async create(
		telegramId: number | bigint,
		plan: ISubscriptionPlan,
	): Promise<Invoice> {
		const idempotenceKey = this.paymentService.createIdempotenceKey(telegramId);
		try {
			const newInvoice = await this.client.createInvoice({
				amount: plan.price,
				asset: plan.currency as CryptoCurrencyCode,
				acceptedAssets: ['USDT', 'TON', 'ETH'],
				expiresIn: 3600, // 1 hour
				payload: {
					telegram_id: telegramId.toString(),
					idempotence_key: idempotenceKey,
				},
			});

			const payload: Partial<IPayment> = {
				amount: plan.price,
				currency: plan.currency,
				provider: 'crypto-bot',
				status: normalizePaymentStatus('crypto-bot', newInvoice.status),
				provider_payment_id: newInvoice.id.toString(),
				idempotence_key: idempotenceKey,
				confirmation_url: newInvoice.botPayUrl,
				raw: JSON.stringify(newInvoice),
			};

			await this.cms.directus.request(
				createItem('payments', {
					...payload,
					is_link_sent: false,
				}),
			);

			return newInvoice;
		} catch (error) {
			const typedError: Error = error as Error;
			throw new InternalServerErrorException(typedError.message);
		}
	}

	async update(notification: ICryptoPayUpdate): Promise<void> {
		const providerPaymentId = String(notification.payload.invoice_id);
		const existedPayment =
			await this.paymentService.getPaymentByTransactionId(providerPaymentId);

		const basePayload = this.createPayload(notification.payload, {
			idempotenceKey: this.paymentService.extractIdempotenceKey(
				this.parseMetadata(notification.payload.payload),
			),
		});

		if (existedPayment?.id) {
			await this.cms.directus.request(
				updateItems(
					'payments',
					{
						filter: { provider_payment_id: { _eq: providerPaymentId } },
					},
					basePayload,
				),
			);
			return;
		}

		await this.cms.directus.request(
			createItem('payments', {
				...basePayload,
				is_link_sent: false,
			}),
		);
	}

	createPayload(
		invoice: ICryptoPayInvoice,
		options: { idempotenceKey?: string },
	): Record<string, unknown> {
		const payload: Record<string, unknown> = {
			amount: Number(invoice.amount),
			currency: invoice.asset ?? invoice.fiat ?? 'USD',
			provider_payment_id: String(invoice.invoice_id),
			status: normalizePaymentStatus('crypto-bot', invoice.status),
			provider: 'crypto-bot',
			confirmation_url: invoice.bot_invoice_url ?? invoice.pay_url,
			raw: JSON.stringify(invoice),
		};

		if (options.idempotenceKey) {
			payload.idempotence_key = options.idempotenceKey;
		}

		if (invoice.paid_at) {
			payload.paid_at = invoice.paid_at;
		}

		return payload;
	}

	async processNotificationSafely(body: unknown): Promise<void> {
		const paymentId = getRawNotificationObjectId(
			body,
			CRYPTOBOT_NOTIFICATION_FIELDS.objectField,
			CRYPTOBOT_NOTIFICATION_FIELDS.objectIdField,
		);
		const updateType = getRawNotificationEvent(
			body,
			CRYPTOBOT_NOTIFICATION_FIELDS.eventField,
		);

		try {
			if (
				!isPaymentNotificationEnvelope<ICryptoPayUpdate>(
					body,
					CRYPTOBOT_NOTIFICATION_FIELDS,
				)
			) {
				this.logger.log(
					`Skipping non-payment event=${updateType ?? 'unknown'} objectId=${paymentId ?? 'unknown'}`,
				);
				return;
			}

			await this.update(body);

			if (body.update_type !== 'invoice_paid') return;
			if (!paymentId) {
				this.logger.warn('No paymentId in notification payload.');
				return;
			}

			const telegramId = this.extractTelegramId(body);
			if (telegramId === null) {
				this.logger.warn(
					`No valid telegramId in payment metadata. paymentId=${paymentId}`,
				);
				return;
			}

			const existingPayment =
				await this.paymentService.getPaymentByTransactionId(paymentId);

			if (!existingPayment) {
				this.logger.warn(`Payment not found in DB. paymentId=${paymentId}`);
				return;
			}

			if (existingPayment.is_link_sent) {
				this.logger.log(
					`Invite link already sent. paymentId=${paymentId}, telegramId=${telegramId}`,
				);
				return;
			}

			const inviteLink =
				existingPayment.invite_link ??
				(await this.bot.createOnetimeInviteLink()).invite_link;

			const canSend = await this.paymentService.markLinkSentIfNotSent(
				paymentId,
				inviteLink,
			);

			if (!canSend) {
				this.logger.log(
					`Skip duplicate send attempt. paymentId=${paymentId}, telegramId=${telegramId}`,
				);
				return;
			}

			const user = await this.cms.getUserByTelegramId(telegramId);

			await this.userSubsService.create({
				started_at: existingPayment.paid_at,
				activated_at: existingPayment.paid_at,
				payments: existingPayment,
				source: 'crypto-bot',
				status: 'active',
				user: user,
			});

			try {
				await this.bot.telegram.sendMessage(telegramId, payMessages.success, {
					parse_mode: 'HTML',
					reply_markup: {
						inline_keyboard: afterPayKeyboard(inviteLink),
					},
				});

				await this.bot.sendAdminMessage({
					text: payMessages.sendAdminSuccess(existingPayment),
					title: 'Произошла оплата приватного телеграм канала!',
				});
			} catch (sendError) {
				await this.paymentService.markLinkAsNotSent(paymentId);
				throw sendError;
			}

			this.logger.log(
				`Invite link sent. paymentId=${paymentId}, telegramId=${telegramId}`,
			);
		} catch (e) {
			this.logger.error(
				`processNotificationSafely failed (paymentId=${paymentId ?? 'unknown'}): ${String(
					(e as Error)?.message ?? e,
				)}`,
			);
			this.logger.error(e);
		}
	}

	private extractTelegramId(body: ICryptoPayUpdate): number | null {
		const metadata = this.parseMetadata(body?.payload?.payload);
		const rawTelegramId = metadata?.telegram_id ?? metadata?.telegramId;

		if (rawTelegramId === undefined || rawTelegramId === null) {
			return null;
		}

		const telegramId = Number(rawTelegramId);
		return Number.isFinite(telegramId) ? telegramId : null;
	}

	private parseMetadata(
		metadata: unknown,
	): Record<string, unknown> | undefined {
		if (!metadata) return undefined;
		if (typeof metadata === 'object') {
			return metadata as Record<string, unknown>;
		}
		if (typeof metadata !== 'string') return undefined;

		try {
			const parsed = JSON.parse(metadata) as unknown;
			if (parsed && typeof parsed === 'object') {
				return parsed as Record<string, unknown>;
			}
		} catch {
			return undefined;
		}

		return undefined;
	}
}
