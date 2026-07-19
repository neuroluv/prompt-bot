import { emojis } from 'lib/utils';
import { Markup } from 'telegraf';

export const downloadKeyboard = (prompt: string) => {
	const resultKeyboard = [
		[
			Markup.button.callback(
				`Скачать файл ${emojis.down}`,
				`download-file-${prompt}`,
			),
		],
		[Markup.button.callback(`${emojis.back} На главную`, 'main-menu')],
	];

	return resultKeyboard;
};
