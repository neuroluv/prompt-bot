import { emojis } from 'lib/utils';
import { Markup } from 'telegraf';

export const goToHomeKeyboard = () => {
	const resultKeyboard = [
		[Markup.button.callback(`${emojis.back} На главную`, 'main-menu')],
	];

	return resultKeyboard;
};
