import { urlPlus } from 'lib/helpers';
import { emojis } from 'lib/utils';
import { Markup } from 'telegraf';
import { goToHomeKeyboard } from './go-to-home.keyboard';

export const appKeyboard = () => {
	return [
		[
			Markup.button.webApp(
				`${emojis.robot} Библиотека промптов`,
				'https://app.neuroluv.ru',
			),
		],
		[
			urlPlus(
				`Rina VPN – Лучший VPN`,
				'https://t.me/rinavpn_bot?start=neuroluv_bot',
				{
					icon_custom_emoji_id: emojis.premium.forButtons.lightning,
					style: 'primary',
				},
			),
		],
		...goToHomeKeyboard(),
	];
};
