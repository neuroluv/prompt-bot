import { CHANNELS_LINKS } from 'lib/common';
import { emojis } from 'lib/utils';
import { Markup } from 'telegraf';

export const downloadKeyboard = (prompt: string) => {
	const resultKeyboard = [
		[
			Markup.button.url(
				`${emojis.link} Подписаться на канал`,
				`https://t.me/${CHANNELS_LINKS[0].value}`,
			),
			Markup.button.callback(
				`Скачать файл ${emojis.down}`,
				`download-file-${prompt}`,
			),
		],
		[Markup.button.callback(`${emojis.back} На главную`, 'main-menu')],
	];

	return resultKeyboard;
};
