export type YooKassaNotification<T> = {
	type: string;
	event:
		| 'payment.waiting_for_capture'
		| 'payment.succeeded'
		| 'payment.canceled'
		| 'refund.succeeded';
	object: T;
};
