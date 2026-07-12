import { urlPlus } from 'lib/helpers';
import { emojis } from 'lib/utils';
import { goToHomeKeyboard } from './go-to-home.keyboard';

export const appKeyboard = () => {
	return [
		[
			urlPlus(
				`Библиотека промптов`,
				'https://neuroluv.ru/prompts?utm_source=neuroluv-telegram-bot&utm_medium=organic',
				{
					icon_custom_emoji_id: emojis.premium.forButtons.robot,
					style: 'primary',
				},
			),
		],
		[
			urlPlus(
				`Rina VPN – Лучший VPN`,
				'https://t.me/rinavpn_bot?start=neuroluv_bot',
				{
					icon_custom_emoji_id: emojis.premium.forButtons.lightning,
				},
			),
		],
		...goToHomeKeyboard(),
	];
};
