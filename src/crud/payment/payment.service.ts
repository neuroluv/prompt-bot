import { readItems, updateItems } from '@directus/sdk';
import { Injectable } from '@nestjs/common';
import { CmsService } from 'cms/cms.service';
import type { IPayment } from 'lib/types/directus';

@Injectable()
export class PaymentService {
  constructor(private readonly cms: CmsService) {}

  async getPaymentByTransactionId(
    transactionId: string,
  ): Promise<IPayment | null> {
    const [payment] = await this.cms.directus.request(
      readItems('payments', {
        filter: { provider_payment_id: { _eq: String(transactionId) } },
        limit: 1,
        sort: ['-date_created'],
      }),
    );

    return payment;
  }

  async markLinkSentIfNotSent(
    transactionId: string,
    inviteLink: string,
  ): Promise<boolean> {
    const updated = await this.cms.directus.request(
      updateItems(
        'payments',
        {
          filter: {
            provider_payment_id: { _eq: String(transactionId) },
            is_link_sent: { _eq: false },
          },
        },
        {
          invite_link: inviteLink,
          is_link_sent: true,
        },
      ),
    );

    return Array.isArray(updated) ? updated.length > 0 : Boolean(updated);
  }

  async markLinkAsNotSent(transactionId: string): Promise<void> {
    await this.cms.directus.request(
      updateItems(
        'payments',
        {
          filter: { provider_payment_id: { _eq: String(transactionId) } },
        },
        { is_link_sent: false },
      ),
    );
  }

  createIdempotenceKey(telegramId: number | bigint): string {
    return `${telegramId}-${Date.now()}`;
  }

  extractIdempotenceKey(metadata: unknown): string | undefined {
    if (!metadata || typeof metadata !== 'object') return undefined;

    const typedMetadata = metadata as Record<string, unknown>;

    if (typeof typedMetadata.idempotence_key === 'string') {
      return typedMetadata.idempotence_key;
    }

    if (typeof typedMetadata.idempotenceKey === 'string') {
      return typedMetadata.idempotenceKey;
    }

    return undefined;
  }
}
