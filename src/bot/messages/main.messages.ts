import { emojis } from 'lib/utils';

export const mainMessages = {
	hello: `
<b>Привет! Рада тебя видеть ${emojis.premium.dog}</b>

Я собрала для тебя три штуки, которые реально экономят время:

${emojis.premium.robot} <b>Библиотека промптов</b> – удобный сборник промптов, в котором можно быстро найти нужный стиль/задачу и <b>копировать промпты в один тап</b>.

${emojis.premium.diamond} <b>Файлы с промптами</b> – подборки промптов + полезные материалы, которые можно забрать себе.`,

	successDownload: `
Ура, всё получилось ${emojis.premium.heartPixel}
Подписка подтверждена!\n\nВот твой файл. Надеюсь, он будет тебе полезен ${emojis.premium.stars}

Если захочешь - можешь вернуться и выбрать ещё один файл из доступных.`,

	needSubscribe: `
Кажется, ты ещё не подписался(ась) на канал ${emojis.premium.flower}

Чтобы я могла выдать файл, нужно:
${emojis.premium.numbers[1]} Подписаться на мой Telegram-канал
${emojis.premium.numbers[2]} Вернуться сюда и нажать «Проверить подписку»

Это займёт буквально минутку ${emojis.premium.sandClock}`,

	loading: `${emojis.premium.loading}`,
};
