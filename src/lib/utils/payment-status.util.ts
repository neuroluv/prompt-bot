import type { PaymentStatus } from 'lib/types/directus';

export const NORMALIZED_PAYMENT_STATUSES = [
  'pending',
  'succeeded',
  'created',
  'canceled',
  'refunded',
] as const;

export type NormalizedPaymentStatus =
  (typeof NORMALIZED_PAYMENT_STATUSES)[number] & PaymentStatus;

export type PaymentProvider = 'yookassa' | 'crypto-bot';

const YOOKASSA_STATUS_MAP: Record<string, NormalizedPaymentStatus> = {
  waiting_for_capture: 'pending',
  pending: 'pending',
  succeeded: 'succeeded',
  canceled: 'canceled',
};

const CRYPTOBOT_STATUS_MAP: Record<string, NormalizedPaymentStatus> = {
  pending: 'pending',
  active: 'created',
  expired: 'canceled',
  paid: 'succeeded',
  unknown: 'created',
};

const PROVIDER_STATUS_MAP: Record<
  PaymentProvider,
  Record<string, NormalizedPaymentStatus>
> = {
  yookassa: YOOKASSA_STATUS_MAP,
  'crypto-bot': CRYPTOBOT_STATUS_MAP,
};

export function normalizePaymentStatus(
  provider: PaymentProvider,
  rawStatus: unknown,
): NormalizedPaymentStatus {
  const status = normalizeRawStatus(rawStatus);
  const statusMap = PROVIDER_STATUS_MAP[provider];

  if (!status) return 'created';
  if (isNormalizedPaymentStatus(status)) return status;
  return statusMap[status] ?? 'created';
}

export function getNormalizedPaymentStatuses(): readonly NormalizedPaymentStatus[] {
  return NORMALIZED_PAYMENT_STATUSES;
}

export function getProviderPaymentStatuses(
  provider: PaymentProvider,
): readonly string[] {
  return Object.keys(PROVIDER_STATUS_MAP[provider]);
}

function normalizeRawStatus(status: unknown): string | null {
  if (typeof status !== 'string') return null;
  const normalized = status.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function isNormalizedPaymentStatus(
  status: string,
): status is NormalizedPaymentStatus {
  return NORMALIZED_PAYMENT_STATUSES.includes(
    status as NormalizedPaymentStatus,
  );
}
