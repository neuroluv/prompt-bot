import { ILabelValue } from 'lib/types';
import { emojis } from 'lib/utils';
import { Markup } from 'telegraf';

export const channelsKeyboard = (channels: ILabelValue[]) => {
  const resultKeyboard = channels.map((channel) => {
    return [Markup.button.url(channel.label, `https://t.me/${channel.value}`)];
  });

  return [
    ...resultKeyboard,
    [
      Markup.button.callback(
        `${emojis.checkmark} Проверить подписку`,
        `check-subs`,
      ),
    ],
  ];
};
