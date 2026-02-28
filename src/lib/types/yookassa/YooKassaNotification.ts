import type { IWebHookEvent } from '@a2seven/yoo-checkout';

export type YooKassaNotification<T> = {
	type: string;
	event: IWebHookEvent;
	object: T;
};
