import { CHANNELS_LINKS } from 'lib/common';
import { emojis } from 'lib/utils';

export const mainMessages = {
  hello: `<b>Привет! Рад тебя видеть ${emojis.premium.dog}</b>\n\nЯ подготовила для тебя несколько полезных файлов: 3 файла с промптами и гайд по созданию AI модели, которые можно забрать бесплатно.\n\Выбирай то, что сейчас актуальнее всего ${emojis.premium.stars}\n\n<b>Небольшое условие:</b>\nнужно быть подписанным на мой <b><a href="https://t.me/${CHANNELS_LINKS[0].value}">Telegram-канал</a></b> ${emojis.premium.heartPixel}\n\nПодпишись, возвращайся сюда  и я сразу открою доступ к файлам ${emojis.premium.handDown}`,

  successDownload: `Ура, всё получилось ${emojis.premium.heartPixel}\nПодписка подтверждена!\n\nВот твой файл. Надеюсь, он будет тебе полезен ${emojis.premium.stars}\n\nЕсли захочешь - можешь вернуться и выбрать ещё один файл из доступных.`,

  needSubscribe: `Кажется, ты ещё не подписался(ась) на канал ${emojis.premium.flower}\n\nЧтобы я могла выдать файл, нужно:\n${emojis.premium.numbers[1]} Подписаться на мой Telegram-канал\n${emojis.premium.numbers[2]} Вернуться сюда и нажать «Проверить подписку»\n\nЭто займёт буквально минутку ${emojis.premium.sandClock}`,

  loading: `${emojis.premium.loading}`,
};
