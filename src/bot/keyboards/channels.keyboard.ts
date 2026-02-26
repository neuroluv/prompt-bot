import { urlPlus } from 'lib/helpers';
import { ILabelValue } from 'lib/types';
import { emojis } from 'lib/utils';
import { Markup } from 'telegraf';

export const channelsKeyboard = (channels: ILabelValue[]) => {
  const resultKeyboard = channels.map((channel) => {
    return [
      urlPlus(channel.label, `https://t.me/${channel.value}`, {
        icon_custom_emoji_id: emojis.premium.forButtons.robot,
      }),
    ];
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
