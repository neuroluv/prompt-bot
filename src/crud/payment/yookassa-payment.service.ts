import {
	type ICreateError,
	type ICreatePayment,
	Payment,
	YooCheckout,
} from '@a2seven/yoo-checkout';
import { createItem, readItems, updateItems } from '@directus/sdk';
import {
	forwardRef,
	Inject,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	getRawNotificationEvent,
	getRawNotificationObjectId,
	isPaymentNotificationEnvelope,
	normalizePaymentStatus,
	YOOKASSA_NOTIFICATION_FIELDS,
} from '@utils';
import { AxiosError } from 'axios';
import { BotService } from 'bot/bot.service';
import { afterPayKeyboard } from 'bot/keyboards';
import { payMessages } from 'bot/messages';
import { CmsService } from 'cms/cms.service';
import { SystemLoggerService } from 'config';
import { UserSubscriptionsService } from 'crud/subscription/users-subscriptions.service';
import { YooKassaNotification } from 'lib/types';
import type { IPayment, ISubscriptionPlan } from 'lib/types/directus';
import { PaymentService } from './payment.service';
import { ReceiptService } from './receipt.service';

@Injectable()
export class YookassaPaymentService {
	private readonly yookassaShopId: string;
	private readonly yookassaKey: string;
	private readonly yookassa: YooCheckout;

	constructor(
		private readonly config: ConfigService,
		private readonly logger: SystemLoggerService,
		private readonly cms: CmsService,
		private readonly userSubsService: UserSubscriptionsService,
		@Inject(forwardRef(() => BotService))
		private readonly bot: BotService,
		@Inject(forwardRef(() => PaymentService))
		private readonly paymentService: PaymentService,
		private readonly receiptService: ReceiptService,
	) {
		this.yookassaShopId = this.config.getOrThrow('YOOKASSA_SHOP_ID');
		this.yookassaKey = this.config.getOrThrow('YOOKASSA_KEY');

		this.yookassa = new YooCheckout({
			secretKey: this.yookassaKey,
			shopId: this.yookassaShopId,
		});
	}

	async findByTelegramId(
		telegramId: number | bigint,
	): Promise<IPayment | null> {
		const activePaymentStatuses: ReadonlyArray<IPayment['status']> = [
			'created',
			'pending',
		];
		const idempotenceKeyPrefix = `${telegramId.toString()}-`;
		const [existedPayment] = await this.cms.directus.request(
			readItems('payments', {
				filter: {
					_and: [
						{
							provider: {
								_eq: 'yookassa',
							},
						},
						{
							_or: [
								{
									status: {
										_eq: 'created',
									},
								},
								{
									status: {
										_eq: 'pending',
									},
								},
							],
						},
						{
							idempotence_key: {
								_starts_with: idempotenceKeyPrefix,
							},
						},
					],
				},
				limit: 1,
				sort: ['-date_created'],
			}),
		);

		if (!existedPayment || !existedPayment.id) {
			return null;
		}

		if (!activePaymentStatuses.includes(existedPayment.status)) {
			return null;
		}

		return existedPayment;
	}

	async findOrCreate(
		telegramId: number | bigint,
		plan: ISubscriptionPlan,
	): Promise<Payment | null> {
		const isPaymentExist = await this.findByTelegramId(telegramId);

		if (!isPaymentExist) {
			return await this.create(telegramId, plan);
		}

		const yookassaPayment = await this.yookassa.getPayment(
			isPaymentExist.provider_payment_id,
		);
		if (!yookassaPayment) {
			return await this.create(telegramId, plan);
		}
		if (
			yookassaPayment.status !== 'pending' &&
			yookassaPayment.status !== 'waiting_for_capture'
		) {
			return await this.create(telegramId, plan);
		}

		return yookassaPayment;
	}

	async create(
		telegramId: number | bigint,
		plan: ISubscriptionPlan,
	): Promise<Payment | null> {
		const idempotenceKey = this.paymentService.createIdempotenceKey(telegramId);
		const payload: ICreatePayment = {
			amount: {
				value: plan.price.toString(),
				currency: plan.currency,
			},
			metadata: {
				telegram_id: telegramId.toString(),
				idempotence_key: idempotenceKey,
				email: 'kireev.kirill2004@mail.ru',
			},
			payment_method_data: {
				type: 'bank_card',
			},
			capture: true,
			confirmation: {
				type: 'redirect',
				return_url: `https://t.me/${this.bot.username}`,
			},
		};

		try {
			const payment = await this.yookassa.createPayment(
				payload,
				idempotenceKey,
			);
			const createPayload = this.createPayload(payment, {
				idempotenceKey,
			});

			await this.cms.directus.request(
				createItem('payments', {
					...createPayload,
					is_link_sent: false,
				}),
			);

			return payment;
		} catch (error) {
			const typedError = error as AxiosError<ICreateError>;
			throw new InternalServerErrorException(
				typedError.response.data.description,
			);
		}
	}

	async update(notification: YooKassaNotification<Payment>): Promise<void> {
		const providerPaymentId = String(notification.object.id);
		const existedPayment =
			await this.paymentService.getPaymentByTransactionId(providerPaymentId);

		const basePayload = this.createPayload(notification.object, {
			idempotenceKey: this.paymentService.extractIdempotenceKey(
				notification.object.metadata,
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
		payment: Payment,
		options: { idempotenceKey?: string },
	): Record<string, unknown> {
		const payload: Record<string, unknown> = {
			amount: Number(payment.amount.value),
			currency: payment.amount.currency,
			provider_payment_id: String(payment.id),
			status: normalizePaymentStatus('yookassa', payment.status),
			provider: 'yookassa',
			raw: JSON.stringify(payment),
		};

		if (options.idempotenceKey) {
			payload.idempotence_key = options.idempotenceKey;
		}

		if (payment.confirmation?.confirmation_url !== undefined) {
			payload.confirmation_url = payment.confirmation.confirmation_url;
		}

		if (payment.captured_at !== undefined) {
			payload.paid_at = payment.captured_at;
		}

		return payload;
	}

	async processNotificationSafely(body: unknown): Promise<void> {
		const paymentId = getRawNotificationObjectId(
			body,
			YOOKASSA_NOTIFICATION_FIELDS.objectField,
			YOOKASSA_NOTIFICATION_FIELDS.objectIdField,
		);
		const event = getRawNotificationEvent(
			body,
			YOOKASSA_NOTIFICATION_FIELDS.eventField,
		);

		try {
			if (
				!isPaymentNotificationEnvelope<YooKassaNotification<Payment>>(
					body,
					YOOKASSA_NOTIFICATION_FIELDS,
				)
			) {
				this.logger.log(
					`Skipping non-payment event=${event ?? 'unknown'} objectId=${paymentId ?? 'unknown'}`,
				);
				return;
			}

			await this.update(body);

			if (body.event !== 'payment.succeeded') return;
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
				source: 'yookassa',
				status: 'active',
				user: user,
			});

			// TODO: добавить создание чека

			try {
				const newNalogIncome = await this.receiptService.newIncome({
					amount: 10,
					name: 'Оплата подписки на приватный канал',
					quantity: 1,
				});

				console.log(newNalogIncome);

				const findedReceipt = await this.receiptService.getReceipt(
					newNalogIncome.approvedReceiptUuid,
				);

				console.log('find receipt');
				console.log(findedReceipt);
			} catch (error) {
				console.log(error);
			}

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
		}
	}

	private extractTelegramId(
		body: YooKassaNotification<Payment>,
	): number | null {
		const metadata = body?.object?.metadata as
			| Record<string, unknown>
			| undefined;
		const rawTelegramId = metadata?.telegram_id ?? metadata?.telegramId;

		if (rawTelegramId === undefined || rawTelegramId === null) {
			return null;
		}

		const telegramId = Number(rawTelegramId);
		return Number.isFinite(telegramId) ? telegramId : null;
	}

	private extractEmail(body: YooKassaNotification<Payment>): string | null {
		const metadata = body?.object?.metadata as
			| Record<string, unknown>
			| undefined;
		const rawEmail = metadata?.email;

		if (rawEmail === undefined || rawEmail === null) {
			return null;
		}

		const email = String(rawEmail);

		return email;
	}
}
