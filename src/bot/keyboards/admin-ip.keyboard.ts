import type { InlineKeyboardMarkup } from 'telegraf/types';

export type RegistrationIpAction =
	'menu' | 'choose' | 'block' | 'unblock' | 'confirm_unblock';
export type IpBlockDuration = number | null;

export function ipBlockDurationText(days: IpBlockDuration): string {
	if (days === null) return 'навсегда';
	const lastTwo = days % 100,
		last = days % 10;
	const unit =
		last === 1 && lastTwo !== 11
			? 'день'
			: last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)
				? 'дня'
				: 'дней';
	return `на ${days} ${unit}`;
}

export function registrationIpCallback(
	action: RegistrationIpAction,
	userId: string,
	days?: IpBlockDuration,
): string {
	return `admin_ip:${action}:${days === undefined ? '' : `${days === null ? 'forever' : days}:`}${userId}`;
}

export function registrationIpDurationKeyboard(
	userId: string,
	blocked: boolean,
): InlineKeyboardMarkup {
	return {
		inline_keyboard: [
			[1, 3, 7].map((days) => ({
				text: `${days} ${days === 1 ? 'день' : days === 3 ? 'дня' : 'дней'}`,
				callback_data: registrationIpCallback('choose', userId, days),
			})),
			[30, 90, 365].map((days) => ({
				text: `${days} дней`,
				callback_data: registrationIpCallback('choose', userId, days),
			})),
			[
				{
					text: 'Навсегда',
					callback_data: registrationIpCallback('choose', userId, null),
				},
			],
			...(blocked
				? [
						[
							{
								text: 'Снять блокировку IP',
								callback_data: registrationIpCallback('unblock', userId),
							},
						],
					]
				: []),
		],
	};
}

export function registrationIpConfirmKeyboard(
	userId: string,
	days: IpBlockDuration | undefined,
): InlineKeyboardMarkup {
	return {
		inline_keyboard: [
			[
				{
					text:
						days === undefined
							? 'Подтвердить снятие IP-бана'
							: 'Подтвердить блокировку IP',
					callback_data: registrationIpCallback(
						days === undefined ? 'confirm_unblock' : 'block',
						userId,
						days,
					),
				},
			],
			[
				{
					text: 'Назад',
					callback_data: registrationIpCallback('menu', userId),
				},
			],
		],
	};
}
