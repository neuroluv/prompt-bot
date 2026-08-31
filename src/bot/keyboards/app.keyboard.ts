import { emojis } from 'lib/utils';
import { goToHomeKeyboard } from './go-to-home.keyboard';

export const appKeyboard = (miniAppUrl = 'https://neuroluv.ru/ai') => {
	return [
		[
			{
				text: `${emojis.robot} Открыть Нейролюб Studio`,
				web_app: { url: miniAppUrl },
			},
		],
		[
			{
				text: `${emojis.lightning} Rina VPN – Лучший VPN`,
				url: 'https://t.me/rinavpn_bot?start=neuroluv_bot',
			},
		],
		...goToHomeKeyboard(),
	];
};
