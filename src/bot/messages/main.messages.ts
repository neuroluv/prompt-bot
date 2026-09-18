import { CHANNELS_LINKS } from 'lib/common';
import { emojis } from 'lib/utils';

export const mainMessages = {
	hello: `
<b>Привет! Рада тебя видеть ${emojis.premium.dog}</b>

<b>Нейролюб Studio</b> — нейросети для текста, изображений и видео в одном удобном Mini App.

${emojis.premium.robot} Выбирай модели, прикрепляй референсы, запускай генерации и получай готовые результаты прямо в Telegram.

${emojis.premium.diamond} Здесь также остаются файлы с промптами и полезные материалы, которые можно забрать себе.`,

	successDownload: `
Ура, всё получилось ${emojis.premium.heartPixel}
Подписка подтверждена!\n\nВот твой файл. Надеюсь, он будет тебе полезен ${emojis.premium.stars}

Если захочешь - можешь вернуться и выбрать ещё один файл из доступных.`,

	needSubscribe: `
Кажется, ты ещё не подписался(ась) на все каналы ${emojis.premium.flower}

Чтобы я могла выдать файл, нужно:
${emojis.premium.numbers[1]} Подписаться на три Telegram-канала:
${CHANNELS_LINKS.map((channel) => `• <a href="${channel.url}">${channel.label}</a>`).join('\n')}

${emojis.premium.numbers[2]} Вернуться сюда и нажать «Проверить подписку»

Это займёт буквально минутку ${emojis.premium.sandClock}`,

	loading: `${emojis.premium.loading}`,
};
