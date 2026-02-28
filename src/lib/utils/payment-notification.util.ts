export type NotificationFields = {
	eventField: string;
	objectField: string;
	objectIdField: string;
	eventPrefix: string;
};

export const YOOKASSA_NOTIFICATION_FIELDS: NotificationFields = {
	eventField: 'event',
	objectField: 'object',
	objectIdField: 'id',
	eventPrefix: 'payment.',
};

export const CRYPTOBOT_NOTIFICATION_FIELDS: NotificationFields = {
	eventField: 'update_type',
	objectField: 'payload',
	objectIdField: 'invoice_id',
	eventPrefix: 'invoice_',
};

export function getRawNotificationEvent(
	body: unknown,
	eventField: string,
): string | null {
	const typedBody = asRecord(body);
	if (!typedBody) return null;

	return toStringIfPossible(typedBody[eventField]);
}

export function getRawNotificationObjectId(
	body: unknown,
	objectField: string,
	objectIdField: string = 'id',
): string | null {
	const typedBody = asRecord(body);
	if (!typedBody) return null;

	const typedObject = asRecord(typedBody[objectField]);
	if (!typedObject) return null;

	return toStringIfPossible(typedObject[objectIdField]);
}

export function isPaymentNotificationEnvelope<T>(
	body: unknown,
	fields: NotificationFields,
): body is T {
	const event = getRawNotificationEvent(body, fields.eventField);
	if (!event || !event.startsWith(fields.eventPrefix)) {
		return false;
	}

	return (
		getRawNotificationObjectId(
			body,
			fields.objectField,
			fields.objectIdField,
		) !== null
	);
}

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== 'object') return null;
	return value as Record<string, unknown>;
}

function toStringIfPossible(value: unknown): string | null {
	if (typeof value === 'string' || typeof value === 'number') {
		return String(value);
	}

	return null;
}
