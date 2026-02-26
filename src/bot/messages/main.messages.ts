import { emojis } from 'lib/utils';

export const mainMessages = {
  hello: `<b>Привет! Рад тебя видеть ${emojis.premium.dog}</b>\n\nЯ собрала для тебя две штуки, которые реально экономят время:\n\n${emojis.premium.robot} <b>Библиотека промптов</b> – мини-приложение.\nУдобный каталог, в котором можно быстро найти нужный стиль/задачу и копировать промпты в один тап.\n\n${emojis.premium.diamond} <b>Файлы с промптами</b> – подборки промптов + полезные материалы, которые можно забрать себе.`,

  successDownload: `Ура, всё получилось ${emojis.premium.heartPixel}\nПодписка подтверждена!\n\nВот твой файл. Надеюсь, он будет тебе полезен ${emojis.premium.stars}\n\nЕсли захочешь - можешь вернуться и выбрать ещё один файл из доступных.`,

  needSubscribe: `Кажется, ты ещё не подписался(ась) на канал ${emojis.premium.flower}\n\nЧтобы я могла выдать файл, нужно:\n${emojis.premium.numbers[1]} Подписаться на мой Telegram-канал\n${emojis.premium.numbers[2]} Вернуться сюда и нажать «Проверить подписку»\n\nЭто займёт буквально минутку ${emojis.premium.sandClock}`,

  loading: `${emojis.premium.loading}`,
};
