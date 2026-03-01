import { CHANNELS_LINKS } from 'lib/common';
import { emojis } from 'lib/utils';

export const guideFilesMessages = {
	hello: `${emojis.premium.dog} Я подготовила для тебя несколько полезных файлов: 3 файла с промптами и гайд по созданию AI модели, которые можно забрать бесплатно.\n\Выбирай то, что сейчас актуальнее всего ${emojis.premium.stars}\n\n<b>Небольшое условие:</b>\nнужно быть подписанным на мой <b><a href="https://t.me/${CHANNELS_LINKS[0].value}">Telegram-канал</a></b> ${emojis.premium.heartPixel}\n\nПодпишись, возвращайся сюда  и я сразу открою доступ к файлам ${emojis.premium.handDown}`,
};
