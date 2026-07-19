import { emojis } from 'lib/utils';
import { Markup } from 'telegraf';

export const channelsKeyboard = () => {
	return [
		[
			Markup.button.callback(
				`${emojis.checkmark} Проверить подписку`,
				`check-subs`,
			),
		],
	];
};
