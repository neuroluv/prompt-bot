import { callbackPlus, urlPlus, webAppPlus } from 'lib/helpers';
import { emojis } from 'lib/utils';

export const mainKeyboard = () => {
	const resultKeyboard = [
		[
			webAppPlus(`Библиотека промптов`, 'https://app.neuroluv.ru', {
				icon_custom_emoji_id: emojis.premium.forButtons.robot,
			}),
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
					style: 'primary',
				},
			),
		],
	];

	return resultKeyboard;
};
