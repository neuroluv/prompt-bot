import { ILabelValue } from 'lib/types';
import { emojis } from 'lib/utils';
import { Markup } from 'telegraf';

export const promptKeyboard = (channel: ILabelValue) => {
  const resultKeyboard = [
    [
      Markup.button.url(channel.label, `https://t.me/${channel.value}`),
      Markup.button.callback(`${emojis.robot} 50 промптов`, 'download-file-50'),
    ],
    [
      Markup.button.callback(
        `${emojis.diamond} 100+ промптов`,
        'download-file-100',
      ),
      Markup.button.callback(
        `${emojis.gift} 107 промптов для фото`,
        'download-file-107',
      ),
    ],
  ];

  return resultKeyboard;
};
