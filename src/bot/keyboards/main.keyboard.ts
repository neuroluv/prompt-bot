import { callbackPlus, urlPlus } from 'lib/helpers';
import { emojis } from 'lib/utils';

export const mainKeyboard = () => {
	const resultKeyboard = [
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
			callbackPlus(`Файлы с промптами`, 'guide_files', {
				icon_custom_emoji_id: emojis.premium.forButtons.diamond,
			}),
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
	];

	return resultKeyboard;
};
